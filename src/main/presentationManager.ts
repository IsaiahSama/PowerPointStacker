/**
 * PowerPoint Stacker - Presentation Manager
 * Manages presentation queue and navigation state
 */

import { BrowserWindow } from 'electron';
import type {
  PresentationQueue,
  PresentationFile,
  Slide,
  UUID,
  SlideDataResponse,
  AddPresentationsResponse,
  PresentationEndedEvent
} from '../common/types';
import { ErrorCode, AppError, NavigationDirection } from '../common/types';
import { PresentationParser } from './presentationParser';

export class PresentationManager {
  private queue: PresentationQueue;
  private parser: PresentationParser;
  private slideCache: Map<string, Slide> = new Map();

  constructor() {
    this.queue = {
      order: [],
      presentations: {},
      currentPresentationId: null,
      currentSlideNumber: null
    };
    this.parser = new PresentationParser();
  }

  /**
   * Add presentations to queue
   */
  async addPresentations(filePaths: string[]): Promise<AddPresentationsResponse> {
    const added: PresentationFile[] = [];
    const failed: Array<{ filePath: string; error: string }> = [];

    for (const filePath of filePaths) {
      try {
        const presentation = await this.parser.parsePresentationFile(filePath);
        this.queue.presentations[presentation.id] = presentation;
        this.queue.order.push(presentation.id);
        added.push(presentation);
      } catch (error) {
        failed.push({
          filePath,
          error: error instanceof AppError ? error.message : String(error)
        });
      }
    }

    return { added, failed };
  }

  /**
   * Remove presentation from queue
   */
  removePresentation(presentationId: UUID): void {
    // Check if presentation exists
    if (!this.queue.presentations[presentationId]) {
      throw new AppError(
        ErrorCode.PRESENTATION_NOT_FOUND,
        `Presentation not found: ${presentationId}`
      );
    }

    // Cannot remove while presenting
    if (this.queue.currentPresentationId === presentationId) {
      throw new AppError(
        ErrorCode.INVALID_STATE,
        'Cannot remove presentation while it is being presented'
      );
    }

    // Remove from queue
    delete this.queue.presentations[presentationId];
    this.queue.order = this.queue.order.filter(id => id !== presentationId);

    // Clear cached slides for this presentation
    this.clearPresentationCache(presentationId);
    this.parser.clearCache(presentationId);
  }

  /**
   * Reorder presentations
   */
  reorderPresentations(newOrder: UUID[]): void {
    // Validate that all IDs exist
    const missingIds = newOrder.filter(id => !this.queue.presentations[id]);
    if (missingIds.length > 0) {
      throw new AppError(
        ErrorCode.PRESENTATION_NOT_FOUND,
        `Presentations not found: ${missingIds.join(', ')}`
      );
    }

    // Validate that no IDs are duplicated
    const uniqueIds = new Set(newOrder);
    if (uniqueIds.size !== newOrder.length) {
      throw new AppError(
        ErrorCode.INVALID_STATE,
        'Duplicate presentation IDs in new order'
      );
    }

    // Validate that all presentations are included
    if (newOrder.length !== this.queue.order.length) {
      throw new AppError(
        ErrorCode.INVALID_STATE,
        'New order must include all presentations'
      );
    }

    this.queue.order = newOrder;
  }

  /**
   * Clear all presentations
   */
  clearQueue(): void {
    // Cannot clear while presenting
    if (this.queue.currentPresentationId !== null) {
      throw new AppError(
        ErrorCode.INVALID_STATE,
        'Cannot clear queue while presenting'
      );
    }

    this.queue.order = [];
    this.queue.presentations = {};
    this.slideCache.clear();
    this.parser.clearAllCache();
  }

  /**
   * Get current queue state
   */
  getQueue(): PresentationQueue {
    return { ...this.queue };
  }

  /**
   * Start presentation mode
   */
  async startPresentation(
    startPresentationId?: UUID,
    startSlideNumber?: number
  ): Promise<SlideDataResponse> {
    if (this.queue.order.length === 0) {
      throw new AppError(
        ErrorCode.NO_PRESENTATIONS_LOADED,
        'Cannot start presentation: No presentations loaded'
      );
    }

    // Determine starting point
    if (startPresentationId) {
      if (!this.queue.presentations[startPresentationId]) {
        throw new AppError(
          ErrorCode.PRESENTATION_NOT_FOUND,
          `Presentation not found: ${startPresentationId}`
        );
      }
      this.queue.currentPresentationId = startPresentationId;
    } else {
      this.queue.currentPresentationId = this.queue.order[0];
    }

    const presentation = this.queue.presentations[this.queue.currentPresentationId];

    if (startSlideNumber) {
      if (startSlideNumber < 1 || startSlideNumber > presentation.slideCount) {
        throw new AppError(
          ErrorCode.SLIDE_NOT_FOUND,
          `Invalid slide number: ${startSlideNumber}. Presentation has ${presentation.slideCount} slides.`
        );
      }
      this.queue.currentSlideNumber = startSlideNumber;
    } else {
      this.queue.currentSlideNumber = 1;
    }

    const slideData = await this.getCurrentSlide();
    if (!slideData) {
      throw new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to load current slide'
      );
    }

    return slideData;
  }

  /**
   * Stop presentation mode
   */
  stopPresentation(): void {
    this.queue.currentPresentationId = null;
    this.queue.currentSlideNumber = null;
  }

  /**
   * Navigate to next/previous slide or presentation
   */
  async navigate(direction: NavigationDirection): Promise<SlideDataResponse | null> {
    if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
      throw new AppError(
        ErrorCode.INVALID_STATE,
        'Not in presentation mode'
      );
    }

    const presentation = this.queue.presentations[this.queue.currentPresentationId];
    const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);

    switch (direction) {
      case NavigationDirection.NEXT:
        if (this.queue.currentSlideNumber < presentation.slideCount) {
          // Next slide in current presentation
          this.queue.currentSlideNumber++;
        } else if (currentIndex < this.queue.order.length - 1) {
          // First slide of next presentation
          this.queue.currentPresentationId = this.queue.order[currentIndex + 1];
          this.queue.currentSlideNumber = 1;
        } else {
          // End of all presentations
          return null;
        }
        break;

      case NavigationDirection.PREVIOUS:
        if (this.queue.currentSlideNumber > 1) {
          // Previous slide in current presentation
          this.queue.currentSlideNumber--;
        } else if (currentIndex > 0) {
          // Last slide of previous presentation
          const prevPresentationId = this.queue.order[currentIndex - 1];
          this.queue.currentPresentationId = prevPresentationId;
          this.queue.currentSlideNumber =
            this.queue.presentations[prevPresentationId].slideCount;
        }
        // Already at beginning, do nothing
        break;

      case NavigationDirection.NEXT_PRESENTATION:
        if (currentIndex < this.queue.order.length - 1) {
          this.queue.currentPresentationId = this.queue.order[currentIndex + 1];
          this.queue.currentSlideNumber = 1;
        }
        break;

      case NavigationDirection.PREVIOUS_PRESENTATION:
        if (currentIndex > 0) {
          this.queue.currentPresentationId = this.queue.order[currentIndex - 1];
          this.queue.currentSlideNumber = 1;
        }
        break;

      case NavigationDirection.FIRST_SLIDE:
        this.queue.currentSlideNumber = 1;
        break;

      case NavigationDirection.LAST_SLIDE:
        this.queue.currentSlideNumber = presentation.slideCount;
        break;
    }

    return await this.getCurrentSlide();
  }

  /**
   * Get current slide data
   */
  async getCurrentSlide(): Promise<SlideDataResponse | null> {
    if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
      return null;
    }

    const presentation = this.queue.presentations[this.queue.currentPresentationId];
    const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);

    // Check cache first
    const cacheKey = `${this.queue.currentPresentationId}:${this.queue.currentSlideNumber}`;
    let slide = this.slideCache.get(cacheKey);

    if (!slide) {
      // Extract slide from presentation
      try {
        slide = await this.parser.extractSlide(
          this.queue.currentPresentationId,
          presentation.filePath,
          presentation.format,
          this.queue.currentSlideNumber,
          presentation.slideCount
        );
        this.slideCache.set(cacheKey, slide);
      } catch (error) {
        throw new AppError(
          ErrorCode.SLIDE_NOT_FOUND,
          `Failed to load slide: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      slide,
      presentationName: presentation.name,
      currentSlideNumber: this.queue.currentSlideNumber,
      totalSlidesInPresentation: presentation.slideCount,
      currentPresentationIndex: currentIndex + 1,
      totalPresentations: this.queue.order.length,
      isFirstSlide: this.queue.currentSlideNumber === 1,
      isLastSlide: this.queue.currentSlideNumber === presentation.slideCount,
      isFirstPresentation: currentIndex === 0,
      isLastPresentation: currentIndex === this.queue.order.length - 1
    };
  }

  /**
   * Check if at end of all presentations
   */
  isAtEnd(): boolean {
    if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
      return false;
    }

    const presentation = this.queue.presentations[this.queue.currentPresentationId];
    const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);

    return (
      currentIndex === this.queue.order.length - 1 &&
      this.queue.currentSlideNumber === presentation.slideCount
    );
  }

  /**
   * Check if at beginning of all presentations
   */
  isAtBeginning(): boolean {
    if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
      return false;
    }

    const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);

    return currentIndex === 0 && this.queue.currentSlideNumber === 1;
  }

  /**
   * Get total number of slides across all presentations
   */
  getTotalSlideCount(): number {
    return this.queue.order.reduce((total, id) => {
      return total + this.queue.presentations[id].slideCount;
    }, 0);
  }

  /**
   * Create presentation ended event data
   */
  getPresentationEndedEvent(): PresentationEndedEvent {
    return {
      totalPresentationsShown: this.queue.order.length,
      totalSlidesShown: this.getTotalSlideCount()
    };
  }

  /**
   * Clear cached slides for a specific presentation
   */
  private clearPresentationCache(presentationId: UUID): void {
    const keysToDelete: string[] = [];
    this.slideCache.forEach((_slide, key) => {
      if (key.startsWith(`${presentationId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.slideCache.delete(key));
  }

  /**
   * Broadcast queue update to all windows
   */
  broadcastQueueUpdate(): void {
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('presentation:queueUpdated', this.queue);
    });
  }
}
