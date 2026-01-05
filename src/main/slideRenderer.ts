/**
 * PowerPoint Stacker - Slide Renderer
 * Handles converting slides to displayable images
 */

import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import type { RenderOptions } from '../common/types';

const execAsync = promisify(exec);

export class SlideRenderer {
  private libreOfficeAvailable: boolean | null = null;
  private libreOfficePath: string | null = null;

  /**
   * Render slide to image buffer
   * Uses LibreOffice in headless mode for actual rendering
   */
  async renderSlide(
    slideXml: string,
    format: 'pptx' | 'odp',
    slideNumber?: number,
    options?: RenderOptions
  ): Promise<Buffer> {
    // This method is deprecated in favor of renderSlideWithLibreOffice
    // Keeping it for backwards compatibility
    const width = options?.maxWidth || 1920;
    const height = options?.maxHeight || 1080;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="white" stroke="#cccccc" stroke-width="2"/>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" fill="#333333">
          Slide ${slideNumber || 1}
        </text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#666666">
          ${format.toUpperCase()} Presentation
        </text>
        <text x="50%" y="70%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999999">
          Error loading slide - LibreOffice may not be available
        </text>
      </svg>
    `;

    try {
      const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();

      return buffer;
    } catch (error) {
      throw new Error(`Failed to render slide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert image buffer to base64 data URL
   */
  bufferToDataURL(buffer: Buffer, mimeType: string): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Optimize image for display
   */
  async optimizeImage(
    buffer: Buffer,
    maxWidth: number,
    maxHeight: number
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render presentation to images using LibreOffice
   * Converts entire presentation to PNG images using a two-step process:
   * 1. Convert presentation to PDF
   * 2. Convert PDF pages to PNG images
   */
  async renderPresentationWithLibreOffice(
    presentationPath: string,
    slideCount: number
  ): Promise<Buffer[]> {
    // Check if LibreOffice is available
    const available = await this.isLibreOfficeAvailable();
    if (!available) {
      throw new Error('LibreOffice is not available on this system. Please install LibreOffice to render presentations.');
    }

    // Create temporary directory for output
    const tempDir = path.join(tmpdir(), `pp-stacker-${randomUUID()}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      const baseName = path.basename(presentationPath, path.extname(presentationPath));
      const pdfPath = path.join(tempDir, `${baseName}.pdf`);

      // Step 1: Convert presentation to PDF using LibreOffice
      const pdfConversionCommand = `${this.libreOfficePath} --headless --convert-to pdf --outdir "${tempDir}" "${presentationPath}"`;

      console.log(`Converting presentation to PDF: ${pdfConversionCommand}`);

      try {
        const { stdout, stderr } = await execAsync(pdfConversionCommand, {
          timeout: 60000, // 60 second timeout
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        console.log('LibreOffice output:', stdout);
        if (stderr) console.log('LibreOffice stderr:', stderr);
      } catch (error) {
        throw new Error(`LibreOffice PDF conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Check if PDF was created
      try {
        await fs.access(pdfPath);
      } catch (error) {
        throw new Error(`PDF file was not created at ${pdfPath}`);
      }

      // Step 2: Convert PDF to PNG images using pdftoppm
      // pdftoppm creates files named: <prefix>-1.png, <prefix>-2.png, etc.
      const pngPrefix = path.join(tempDir, 'slide');
      const pngConversionCommand = `pdftoppm -png -r 150 "${pdfPath}" "${pngPrefix}"`;

      console.log(`Converting PDF to PNG images: ${pngConversionCommand}`);

      try {
        const { stdout, stderr } = await execAsync(pngConversionCommand, {
          timeout: 60000,
          maxBuffer: 10 * 1024 * 1024
        });
        if (stdout) console.log('pdftoppm output:', stdout);
        if (stderr) console.log('pdftoppm stderr:', stderr);
      } catch (error) {
        throw new Error(`PDF to PNG conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Read all generated PNG files
      const files = await fs.readdir(tempDir);
      const pngFiles = files
        .filter(f => f.endsWith('.png'))
        .sort((a, b) => {
          // Extract page numbers for proper sorting
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      if (pngFiles.length === 0) {
        throw new Error('No PNG files were generated from the PDF');
      }

      console.log(`Successfully generated ${pngFiles.length} PNG images from presentation`);

      // Read all PNG buffers in parallel for better performance
      const buffers: Buffer[] = await Promise.all(
        pngFiles.map(async (pngFile) => {
          const filePath = path.join(tempDir, pngFile);
          return await fs.readFile(filePath);
        })
      );

      return buffers;
    } finally {
      // Clean up temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to clean up temp directory: ${tempDir}`, error);
      }
    }
  }

  /**
   * Render a single slide using LibreOffice
   */
  async renderSlideWithLibreOffice(
    presentationPath: string,
    slideNumber: number,
    totalSlides: number
  ): Promise<Buffer> {
    // For now, we render all slides and return the requested one
    // This could be optimized to only render the specific slide
    const buffers = await this.renderPresentationWithLibreOffice(presentationPath, totalSlides);

    if (slideNumber < 1 || slideNumber > buffers.length) {
      throw new Error(`Invalid slide number: ${slideNumber}. Presentation has ${buffers.length} slides.`);
    }

    return buffers[slideNumber - 1];
  }

  /**
   * Check if LibreOffice is available on the system
   */
  async isLibreOfficeAvailable(): Promise<boolean> {
    // Return cached result if available
    if (this.libreOfficeAvailable !== null) {
      return this.libreOfficeAvailable;
    }

    try {
      // Try common LibreOffice command names
      const commands = [
        'libreoffice',
        'libreoffice7.0',
        'libreoffice6.0',
        'soffice'
      ];

      for (const cmd of commands) {
        try {
          const { stdout } = await execAsync(`which ${cmd}`);
          if (stdout.trim()) {
            this.libreOfficePath = cmd;
            this.libreOfficeAvailable = true;
            console.log(`Found LibreOffice at: ${cmd}`);
            return true;
          }
        } catch (error) {
          // Command not found, try next
          continue;
        }
      }

      // If we get here, LibreOffice was not found
      this.libreOfficeAvailable = false;
      console.warn('LibreOffice not found. Presentations will not render properly.');
      return false;
    } catch (error) {
      console.error('Error checking for LibreOffice:', error);
      this.libreOfficeAvailable = false;
      return false;
    }
  }

  /**
   * Extract embedded images from presentation
   * This can be used as an alternative to full rendering
   */
  async extractEmbeddedImage(
    presentationBuffer: Buffer,
    imageIndex: number
  ): Promise<Buffer | null> {
    // TODO: Implement extraction of embedded images from PPTX/ODP
    // These are typically stored in ppt/media/ for PPTX
    return null;
  }
}
