/**
 * PowerPoint Stacker - Presentation Parser
 * Handles parsing of PPTX and ODP files
 */

import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import { promises as fs } from 'fs';
import path from 'node:path';
import { randomUUID } from 'crypto';
import type { PresentationFile, Slide, UUID } from '../common/types';
import { ErrorCode } from '../common/types';
import { AppError } from '../common/types';
import { SlideRenderer } from './slideRenderer';

export class PresentationParser {
  private slideRenderer: SlideRenderer;
  private cache: Map<UUID, JSZip> = new Map();
  private renderedSlidesCache: Map<string, Buffer[]> = new Map();

  constructor() {
    this.slideRenderer = new SlideRenderer();
  }

  /**
   * Parse a presentation file and extract metadata
   */
  async parsePresentationFile(filePath: string): Promise<PresentationFile> {
    // Validate file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new AppError(
        ErrorCode.FILE_NOT_FOUND,
        `File not found: ${filePath}`
      );
    }

    // Get file stats
    let fileSize: number;
    try {
      const stats = await fs.stat(filePath);
      fileSize = stats.size;
    } catch (error) {
      throw new AppError(
        ErrorCode.FILE_READ_ERROR,
        `Cannot read file: ${filePath}`
      );
    }

    // Determine file format
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.pptx' && ext !== '.odp') {
      throw new AppError(
        ErrorCode.INVALID_FILE_FORMAT,
        `Invalid file format: ${ext}. Only .pptx and .odp are supported.`
      );
    }

    const format = ext === '.pptx' ? 'pptx' : 'odp';
    const name = path.basename(filePath);
    const id = randomUUID();

    // Read and parse file
    let slideCount: number;
    try {
      const fileBuffer = await fs.readFile(filePath);
      const zip = await JSZip.loadAsync(fileBuffer);

      // Cache the zip for later slide extraction
      this.cache.set(id, zip);

      if (format === 'pptx') {
        slideCount = await this.getPPTXSlideCount(zip);
      } else {
        slideCount = await this.getODPSlideCount(zip);
      }
    } catch (error) {
      throw new AppError(
        ErrorCode.FILE_CORRUPTED,
        `Failed to parse presentation file: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return {
      id,
      filePath,
      name,
      format,
      slideCount,
      fileSize,
      addedAt: Date.now()
    };
  }

  /**
   * Get slide count from PPTX file
   */
  private async getPPTXSlideCount(zip: JSZip): Promise<number> {
    try {
      const presentationXml = zip.file('ppt/presentation.xml');
      if (!presentationXml) {
        throw new Error('Missing ppt/presentation.xml');
      }

      const xmlContent = await presentationXml.async('string');
      const parsed = await parseStringPromise(xmlContent);

      // Count slide IDs in the presentation
      const slideIdList = parsed['p:presentation']?.['p:sldIdLst']?.[0]?.['p:sldId'];
      if (!slideIdList) {
        return 0;
      }

      return Array.isArray(slideIdList) ? slideIdList.length : 1;
    } catch (error) {
      throw new Error(`Failed to parse PPTX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get slide count from ODP file
   */
  private async getODPSlideCount(zip: JSZip): Promise<number> {
    try {
      const contentXml = zip.file('content.xml');
      if (!contentXml) {
        throw new Error('Missing content.xml');
      }

      const xmlContent = await contentXml.async('string');
      const parsed = await parseStringPromise(xmlContent);

      // Count draw:page elements
      const pages = parsed['office:document-content']?.['office:body']?.[0]?.['office:presentation']?.[0]?.['draw:page'];
      if (!pages) {
        return 0;
      }

      return Array.isArray(pages) ? pages.length : 1;
    } catch (error) {
      throw new Error(`Failed to parse ODP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract all slides from presentation as images
   */
  async extractSlides(presentationId: UUID, filePath: string, format: 'pptx' | 'odp', slideCount: number): Promise<Slide[]> {
    const slides: Slide[] = [];

    for (let slideNumber = 1; slideNumber <= slideCount; slideNumber++) {
      const slide = await this.extractSlide(presentationId, filePath, format, slideNumber);
      slides.push(slide);
    }

    return slides;
  }

  /**
   * Extract a specific slide as image
   */
  async extractSlide(presentationId: UUID, filePath: string, format: 'pptx' | 'odp', slideNumber: number, slideCount?: number): Promise<Slide> {
    let zip = this.cache.get(presentationId);

    if (!zip) {
      // Re-read the file if not in cache
      try {
        const fileBuffer = await fs.readFile(filePath);
        zip = await JSZip.loadAsync(fileBuffer);
        this.cache.set(presentationId, zip);
      } catch (error) {
        throw new AppError(
          ErrorCode.FILE_READ_ERROR,
          `Cannot read presentation file: ${filePath}`
        );
      }
    }

    // Get slide count if not provided
    if (!slideCount) {
      try {
        if (format === 'pptx') {
          slideCount = await this.getPPTXSlideCount(zip);
        } else {
          slideCount = await this.getODPSlideCount(zip);
        }
      } catch (error) {
        throw new AppError(
          ErrorCode.PARSE_ERROR,
          `Failed to get slide count: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    try {
      let imageData: string;

      if (format === 'pptx') {
        imageData = await this.extractPPTXSlide(zip, slideNumber, filePath, presentationId, slideCount);
      } else {
        imageData = await this.extractODPSlide(zip, slideNumber, filePath, presentationId, slideCount);
      }

      return {
        id: randomUUID(),
        presentationId,
        slideNumber,
        imageData,
        mimeType: 'image/png'
      };
    } catch (error) {
      throw new AppError(
        ErrorCode.SLIDE_NOT_FOUND,
        `Failed to extract slide ${slideNumber}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract slide image from PPTX
   */
  private async extractPPTXSlide(zip: JSZip, slideNumber: number, presentationPath: string, presentationId: UUID, slideCount: number): Promise<string> {
    // Check if we have cached rendered slides for this presentation
    let renderedSlides = this.renderedSlidesCache.get(presentationId);

    if (!renderedSlides) {
      // Render all slides using LibreOffice
      try {
        renderedSlides = await this.slideRenderer.renderPresentationWithLibreOffice(presentationPath, slideCount);
        this.renderedSlidesCache.set(presentationId, renderedSlides);
      } catch (error) {
        console.error('LibreOffice rendering failed, falling back to placeholder:', error);

        // Fallback: try to find existing slide image in ppt/media/
        const mediaFolder = zip.folder('ppt/media');
        if (mediaFolder) {
          const slideImageFile = zip.file(`ppt/media/image${slideNumber}.png`) ||
                                zip.file(`ppt/media/image${slideNumber}.jpg`) ||
                                zip.file(`ppt/media/image${slideNumber}.jpeg`);

          if (slideImageFile) {
            const buffer = await slideImageFile.async('nodebuffer');
            const optimized = await this.slideRenderer.optimizeImage(buffer, 1920, 1080);
            return this.slideRenderer.bufferToDataURL(optimized, 'image/png');
          }
        }

        // Last resort: placeholder
        const slideXmlFile = zip.file(`ppt/slides/slide${slideNumber}.xml`);
        if (!slideXmlFile) {
          throw new Error(`Slide ${slideNumber} not found`);
        }
        const slideXml = await slideXmlFile.async('string');
        const buffer = await this.slideRenderer.renderSlide(slideXml, 'pptx', slideNumber);
        return this.slideRenderer.bufferToDataURL(buffer, 'image/png');
      }
    }

    // Return the requested slide
    if (slideNumber < 1 || slideNumber > renderedSlides.length) {
      throw new Error(`Invalid slide number: ${slideNumber}`);
    }

    const slideBuffer = renderedSlides[slideNumber - 1];
    const optimized = await this.slideRenderer.optimizeImage(slideBuffer, 1920, 1080);
    return this.slideRenderer.bufferToDataURL(optimized, 'image/png');
  }

  /**
   * Extract slide image from ODP
   */
  private async extractODPSlide(zip: JSZip, slideNumber: number, presentationPath: string, presentationId: UUID, slideCount: number): Promise<string> {
    // Check if we have cached rendered slides for this presentation
    let renderedSlides = this.renderedSlidesCache.get(presentationId);

    if (!renderedSlides) {
      // Render all slides using LibreOffice
      try {
        renderedSlides = await this.slideRenderer.renderPresentationWithLibreOffice(presentationPath, slideCount);
        this.renderedSlidesCache.set(presentationId, renderedSlides);
      } catch (error) {
        console.error('LibreOffice rendering failed, falling back to placeholder:', error);

        // Fallback to placeholder
        const contentXml = zip.file('content.xml');
        if (!contentXml) {
          throw new Error('Missing content.xml');
        }
        const xmlContent = await contentXml.async('string');
        const buffer = await this.slideRenderer.renderSlide(xmlContent, 'odp', slideNumber);
        return this.slideRenderer.bufferToDataURL(buffer, 'image/png');
      }
    }

    // Return the requested slide
    if (slideNumber < 1 || slideNumber > renderedSlides.length) {
      throw new Error(`Invalid slide number: ${slideNumber}`);
    }

    const slideBuffer = renderedSlides[slideNumber - 1];
    const optimized = await this.slideRenderer.optimizeImage(slideBuffer, 1920, 1080);
    return this.slideRenderer.bufferToDataURL(optimized, 'image/png');
  }

  /**
   * Validate file format
   */
  isValidPresentationFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.pptx' || ext === '.odp';
  }

  /**
   * Get slide count without full parsing
   */
  async getSlideCount(filePath: string): Promise<number> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const zip = await JSZip.loadAsync(fileBuffer);

      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.pptx') {
        return await this.getPPTXSlideCount(zip);
      } else {
        return await this.getODPSlideCount(zip);
      }
    } catch (error) {
      throw new AppError(
        ErrorCode.PARSE_ERROR,
        `Failed to get slide count: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear cached zip data for a presentation
   */
  clearCache(presentationId: UUID): void {
    this.cache.delete(presentationId);
    this.renderedSlidesCache.delete(presentationId);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.cache.clear();
    this.renderedSlidesCache.clear();
  }
}
