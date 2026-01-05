"use strict";
/**
 * PowerPoint Stacker - Presentation Manager
 * Manages presentation queue and navigation state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentationManager = void 0;
const electron_1 = require("electron");
const types_1 = require("../common/types");
const presentationParser_1 = require("./presentationParser");
class PresentationManager {
    queue;
    parser;
    slideCache = new Map();
    constructor() {
        this.queue = {
            order: [],
            presentations: {},
            currentPresentationId: null,
            currentSlideNumber: null
        };
        this.parser = new presentationParser_1.PresentationParser();
    }
    /**
     * Add presentations to queue
     */
    async addPresentations(filePaths) {
        const added = [];
        const failed = [];
        for (const filePath of filePaths) {
            try {
                const presentation = await this.parser.parsePresentationFile(filePath);
                this.queue.presentations[presentation.id] = presentation;
                this.queue.order.push(presentation.id);
                added.push(presentation);
            }
            catch (error) {
                failed.push({
                    filePath,
                    error: error instanceof types_1.AppError ? error.message : String(error)
                });
            }
        }
        return { added, failed };
    }
    /**
     * Remove presentation from queue
     */
    removePresentation(presentationId) {
        // Check if presentation exists
        if (!this.queue.presentations[presentationId]) {
            throw new types_1.AppError(types_1.ErrorCode.PRESENTATION_NOT_FOUND, `Presentation not found: ${presentationId}`);
        }
        // Cannot remove while presenting
        if (this.queue.currentPresentationId === presentationId) {
            throw new types_1.AppError(types_1.ErrorCode.INVALID_STATE, 'Cannot remove presentation while it is being presented');
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
    reorderPresentations(newOrder) {
        // Validate that all IDs exist
        const missingIds = newOrder.filter(id => !this.queue.presentations[id]);
        if (missingIds.length > 0) {
            throw new types_1.AppError(types_1.ErrorCode.PRESENTATION_NOT_FOUND, `Presentations not found: ${missingIds.join(', ')}`);
        }
        // Validate that no IDs are duplicated
        const uniqueIds = new Set(newOrder);
        if (uniqueIds.size !== newOrder.length) {
            throw new types_1.AppError(types_1.ErrorCode.INVALID_STATE, 'Duplicate presentation IDs in new order');
        }
        // Validate that all presentations are included
        if (newOrder.length !== this.queue.order.length) {
            throw new types_1.AppError(types_1.ErrorCode.INVALID_STATE, 'New order must include all presentations');
        }
        this.queue.order = newOrder;
    }
    /**
     * Clear all presentations
     */
    clearQueue() {
        // Cannot clear while presenting
        if (this.queue.currentPresentationId !== null) {
            throw new types_1.AppError(types_1.ErrorCode.INVALID_STATE, 'Cannot clear queue while presenting');
        }
        this.queue.order = [];
        this.queue.presentations = {};
        this.slideCache.clear();
        this.parser.clearAllCache();
    }
    /**
     * Get current queue state
     */
    getQueue() {
        return { ...this.queue };
    }
    /**
     * Start presentation mode
     */
    async startPresentation(startPresentationId, startSlideNumber) {
        if (this.queue.order.length === 0) {
            throw new types_1.AppError(types_1.ErrorCode.NO_PRESENTATIONS_LOADED, 'Cannot start presentation: No presentations loaded');
        }
        // Determine starting point
        if (startPresentationId) {
            if (!this.queue.presentations[startPresentationId]) {
                throw new types_1.AppError(types_1.ErrorCode.PRESENTATION_NOT_FOUND, `Presentation not found: ${startPresentationId}`);
            }
            this.queue.currentPresentationId = startPresentationId;
        }
        else {
            this.queue.currentPresentationId = this.queue.order[0];
        }
        const presentation = this.queue.presentations[this.queue.currentPresentationId];
        if (startSlideNumber) {
            if (startSlideNumber < 1 || startSlideNumber > presentation.slideCount) {
                throw new types_1.AppError(types_1.ErrorCode.SLIDE_NOT_FOUND, `Invalid slide number: ${startSlideNumber}. Presentation has ${presentation.slideCount} slides.`);
            }
            this.queue.currentSlideNumber = startSlideNumber;
        }
        else {
            this.queue.currentSlideNumber = 1;
        }
        const slideData = await this.getCurrentSlide();
        if (!slideData) {
            throw new types_1.AppError(types_1.ErrorCode.UNKNOWN_ERROR, 'Failed to load current slide');
        }
        return slideData;
    }
    /**
     * Stop presentation mode
     */
    stopPresentation() {
        this.queue.currentPresentationId = null;
        this.queue.currentSlideNumber = null;
    }
    /**
     * Navigate to next/previous slide or presentation
     */
    async navigate(direction) {
        if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
            throw new types_1.AppError(types_1.ErrorCode.INVALID_STATE, 'Not in presentation mode');
        }
        const presentation = this.queue.presentations[this.queue.currentPresentationId];
        const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);
        switch (direction) {
            case NavigationDirection.NEXT:
                if (this.queue.currentSlideNumber < presentation.slideCount) {
                    // Next slide in current presentation
                    this.queue.currentSlideNumber++;
                }
                else if (currentIndex < this.queue.order.length - 1) {
                    // First slide of next presentation
                    this.queue.currentPresentationId = this.queue.order[currentIndex + 1];
                    this.queue.currentSlideNumber = 1;
                }
                else {
                    // End of all presentations
                    return null;
                }
                break;
            case NavigationDirection.PREVIOUS:
                if (this.queue.currentSlideNumber > 1) {
                    // Previous slide in current presentation
                    this.queue.currentSlideNumber--;
                }
                else if (currentIndex > 0) {
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
    async getCurrentSlide() {
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
                slide = await this.parser.extractSlide(this.queue.currentPresentationId, presentation.filePath, presentation.format, this.queue.currentSlideNumber);
                this.slideCache.set(cacheKey, slide);
            }
            catch (error) {
                throw new types_1.AppError(types_1.ErrorCode.SLIDE_NOT_FOUND, `Failed to load slide: ${error instanceof Error ? error.message : String(error)}`);
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
    isAtEnd() {
        if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
            return false;
        }
        const presentation = this.queue.presentations[this.queue.currentPresentationId];
        const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);
        return (currentIndex === this.queue.order.length - 1 &&
            this.queue.currentSlideNumber === presentation.slideCount);
    }
    /**
     * Check if at beginning of all presentations
     */
    isAtBeginning() {
        if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
            return false;
        }
        const currentIndex = this.queue.order.indexOf(this.queue.currentPresentationId);
        return currentIndex === 0 && this.queue.currentSlideNumber === 1;
    }
    /**
     * Get total number of slides across all presentations
     */
    getTotalSlideCount() {
        return this.queue.order.reduce((total, id) => {
            return total + this.queue.presentations[id].slideCount;
        }, 0);
    }
    /**
     * Create presentation ended event data
     */
    getPresentationEndedEvent() {
        return {
            totalPresentationsShown: this.queue.order.length,
            totalSlidesShown: this.getTotalSlideCount()
        };
    }
    /**
     * Clear cached slides for a specific presentation
     */
    clearPresentationCache(presentationId) {
        const keysToDelete = [];
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
    broadcastQueueUpdate() {
        electron_1.BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('presentation:queueUpdated', this.queue);
        });
    }
}
exports.PresentationManager = PresentationManager;
//# sourceMappingURL=presentationManager.js.map