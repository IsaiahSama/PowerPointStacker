"use strict";
/**
 * PowerPoint Stacker - Presentation Parser
 * Handles parsing of PPTX and ODP files
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentationParser = void 0;
const jszip_1 = __importDefault(require("jszip"));
const xml2js_1 = require("xml2js");
const fs_1 = require("fs");
const node_path_1 = __importDefault(require("node:path"));
const crypto_1 = require("crypto");
const types_1 = require("../common/types");
const types_2 = require("../common/types");
const slideRenderer_1 = require("./slideRenderer");
class PresentationParser {
    slideRenderer;
    cache = new Map();
    constructor() {
        this.slideRenderer = new slideRenderer_1.SlideRenderer();
    }
    /**
     * Parse a presentation file and extract metadata
     */
    async parsePresentationFile(filePath) {
        // Validate file exists
        try {
            await fs_1.promises.access(filePath);
        }
        catch (error) {
            throw new types_2.AppError(types_1.ErrorCode.FILE_NOT_FOUND, `File not found: ${filePath}`);
        }
        // Get file stats
        let fileSize;
        try {
            const stats = await fs_1.promises.stat(filePath);
            fileSize = stats.size;
        }
        catch (error) {
            throw new types_2.AppError(types_1.ErrorCode.FILE_READ_ERROR, `Cannot read file: ${filePath}`);
        }
        // Determine file format
        const ext = node_path_1.default.extname(filePath).toLowerCase();
        if (ext !== '.pptx' && ext !== '.odp') {
            throw new types_2.AppError(types_1.ErrorCode.INVALID_FILE_FORMAT, `Invalid file format: ${ext}. Only .pptx and .odp are supported.`);
        }
        const format = ext === '.pptx' ? 'pptx' : 'odp';
        const name = node_path_1.default.basename(filePath);
        const id = (0, crypto_1.randomUUID)();
        // Read and parse file
        let slideCount;
        try {
            const fileBuffer = await fs_1.promises.readFile(filePath);
            const zip = await jszip_1.default.loadAsync(fileBuffer);
            // Cache the zip for later slide extraction
            this.cache.set(id, zip);
            if (format === 'pptx') {
                slideCount = await this.getPPTXSlideCount(zip);
            }
            else {
                slideCount = await this.getODPSlideCount(zip);
            }
        }
        catch (error) {
            throw new types_2.AppError(types_1.ErrorCode.FILE_CORRUPTED, `Failed to parse presentation file: ${error instanceof Error ? error.message : String(error)}`);
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
    async getPPTXSlideCount(zip) {
        try {
            const presentationXml = zip.file('ppt/presentation.xml');
            if (!presentationXml) {
                throw new Error('Missing ppt/presentation.xml');
            }
            const xmlContent = await presentationXml.async('string');
            const parsed = await (0, xml2js_1.parseStringPromise)(xmlContent);
            // Count slide IDs in the presentation
            const slideIdList = parsed['p:presentation']?.['p:sldIdLst']?.[0]?.['p:sldId'];
            if (!slideIdList) {
                return 0;
            }
            return Array.isArray(slideIdList) ? slideIdList.length : 1;
        }
        catch (error) {
            throw new Error(`Failed to parse PPTX: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get slide count from ODP file
     */
    async getODPSlideCount(zip) {
        try {
            const contentXml = zip.file('content.xml');
            if (!contentXml) {
                throw new Error('Missing content.xml');
            }
            const xmlContent = await contentXml.async('string');
            const parsed = await (0, xml2js_1.parseStringPromise)(xmlContent);
            // Count draw:page elements
            const pages = parsed['office:document-content']?.['office:body']?.[0]?.['office:presentation']?.[0]?.['draw:page'];
            if (!pages) {
                return 0;
            }
            return Array.isArray(pages) ? pages.length : 1;
        }
        catch (error) {
            throw new Error(`Failed to parse ODP: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extract all slides from presentation as images
     */
    async extractSlides(presentationId, filePath, format, slideCount) {
        const slides = [];
        for (let slideNumber = 1; slideNumber <= slideCount; slideNumber++) {
            const slide = await this.extractSlide(presentationId, filePath, format, slideNumber);
            slides.push(slide);
        }
        return slides;
    }
    /**
     * Extract a specific slide as image
     */
    async extractSlide(presentationId, filePath, format, slideNumber) {
        let zip = this.cache.get(presentationId);
        if (!zip) {
            // Re-read the file if not in cache
            try {
                const fileBuffer = await fs_1.promises.readFile(filePath);
                zip = await jszip_1.default.loadAsync(fileBuffer);
                this.cache.set(presentationId, zip);
            }
            catch (error) {
                throw new types_2.AppError(types_1.ErrorCode.FILE_READ_ERROR, `Cannot read presentation file: ${filePath}`);
            }
        }
        try {
            let imageData;
            if (format === 'pptx') {
                imageData = await this.extractPPTXSlide(zip, slideNumber);
            }
            else {
                imageData = await this.extractODPSlide(zip, slideNumber);
            }
            return {
                id: (0, crypto_1.randomUUID)(),
                presentationId,
                slideNumber,
                imageData,
                mimeType: 'image/png'
            };
        }
        catch (error) {
            throw new types_2.AppError(types_1.ErrorCode.SLIDE_NOT_FOUND, `Failed to extract slide ${slideNumber}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extract slide image from PPTX
     */
    async extractPPTXSlide(zip, slideNumber) {
        // Try to find existing slide image in ppt/media/
        const mediaFolder = zip.folder('ppt/media');
        if (mediaFolder) {
            // Look for slide thumbnail or preview images
            const slideImageFile = zip.file(`ppt/media/image${slideNumber}.png`) ||
                zip.file(`ppt/media/image${slideNumber}.jpg`) ||
                zip.file(`ppt/media/image${slideNumber}.jpeg`);
            if (slideImageFile) {
                const buffer = await slideImageFile.async('nodebuffer');
                const optimized = await this.slideRenderer.optimizeImage(buffer, 1920, 1080);
                return this.slideRenderer.bufferToDataURL(optimized, 'image/png');
            }
        }
        // Fallback: render slide using slide renderer
        const slideXmlFile = zip.file(`ppt/slides/slide${slideNumber}.xml`);
        if (!slideXmlFile) {
            throw new Error(`Slide ${slideNumber} not found`);
        }
        const slideXml = await slideXmlFile.async('string');
        const buffer = await this.slideRenderer.renderSlide(slideXml, 'pptx');
        return this.slideRenderer.bufferToDataURL(buffer, 'image/png');
    }
    /**
     * Extract slide image from ODP
     */
    async extractODPSlide(zip, slideNumber) {
        // Read content.xml and extract the specific page
        const contentXml = zip.file('content.xml');
        if (!contentXml) {
            throw new Error('Missing content.xml');
        }
        const xmlContent = await contentXml.async('string');
        // Render the slide
        const buffer = await this.slideRenderer.renderSlide(xmlContent, 'odp', slideNumber);
        return this.slideRenderer.bufferToDataURL(buffer, 'image/png');
    }
    /**
     * Validate file format
     */
    isValidPresentationFile(filePath) {
        const ext = node_path_1.default.extname(filePath).toLowerCase();
        return ext === '.pptx' || ext === '.odp';
    }
    /**
     * Get slide count without full parsing
     */
    async getSlideCount(filePath) {
        try {
            const fileBuffer = await fs_1.promises.readFile(filePath);
            const zip = await jszip_1.default.loadAsync(fileBuffer);
            const ext = node_path_1.default.extname(filePath).toLowerCase();
            if (ext === '.pptx') {
                return await this.getPPTXSlideCount(zip);
            }
            else {
                return await this.getODPSlideCount(zip);
            }
        }
        catch (error) {
            throw new types_2.AppError(types_1.ErrorCode.PARSE_ERROR, `Failed to get slide count: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clear cached zip data for a presentation
     */
    clearCache(presentationId) {
        this.cache.delete(presentationId);
    }
    /**
     * Clear all cached data
     */
    clearAllCache() {
        this.cache.clear();
    }
}
exports.PresentationParser = PresentationParser;
//# sourceMappingURL=presentationParser.js.map