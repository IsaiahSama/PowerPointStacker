/**
 * PowerPoint Stacker - Shared Type Definitions
 *
 * This file contains all TypeScript interfaces and types shared between
 * the main process and renderer process.
 */

/**
 * Unique identifier for presentations and slides
 */
export type UUID = string;

/**
 * Represents a single presentation file
 */
export interface PresentationFile {
  /** Unique identifier */
  id: UUID;

  /** Absolute path to the presentation file */
  filePath: string;

  /** Display name (filename without path) */
  name: string;

  /** File extension (pptx or odp) */
  format: 'pptx' | 'odp';

  /** Total number of slides in presentation */
  slideCount: number;

  /** File size in bytes */
  fileSize: number;

  /** Timestamp when file was added */
  addedAt: number;
}

/**
 * Represents a single slide within a presentation
 */
export interface Slide {
  /** Unique identifier */
  id: UUID;

  /** Parent presentation ID */
  presentationId: UUID;

  /** Slide number (1-indexed) */
  slideNumber: number;

  /** Base64-encoded slide image data */
  imageData: string;

  /** Image MIME type */
  mimeType: 'image/png' | 'image/jpeg';

  /** Optional: Speaker notes */
  notes?: string;
}

/**
 * Application state for presentation queue
 */
export interface PresentationQueue {
  /** Ordered list of presentation IDs */
  order: UUID[];

  /** Map of presentation ID to presentation data */
  presentations: Record<UUID, PresentationFile>;

  /** Currently active presentation ID (null if not presenting) */
  currentPresentationId: UUID | null;

  /** Currently displayed slide number (1-indexed, null if not presenting) */
  currentSlideNumber: number | null;
}

/**
 * Navigation direction enum
 */
export enum NavigationDirection {
  NEXT = 'next',
  PREVIOUS = 'previous',
  NEXT_PRESENTATION = 'next_presentation',
  PREVIOUS_PRESENTATION = 'previous_presentation',
  FIRST_SLIDE = 'first_slide',
  LAST_SLIDE = 'last_slide'
}

/**
 * Application mode enum
 */
export enum AppMode {
  SETUP = 'setup',
  PRESENTING = 'presenting'
}

/**
 * Generic IPC response wrapper
 */
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Payload for adding presentations
 */
export interface AddPresentationsRequest {
  /** Array of absolute file paths */
  filePaths: string[];
}

export interface AddPresentationsResponse {
  /** Successfully added presentations */
  added: PresentationFile[];

  /** Failed file paths with error messages */
  failed: Array<{
    filePath: string;
    error: string;
  }>;
}

/**
 * Payload for removing a presentation
 */
export interface RemovePresentationRequest {
  presentationId: UUID;
}

/**
 * Payload for reordering presentations
 */
export interface ReorderPresentationsRequest {
  /** New order of presentation IDs */
  order: UUID[];
}

/**
 * Payload for starting presentation mode
 */
export interface StartPresentationRequest {
  /** Optional: Start from specific presentation ID */
  startPresentationId?: UUID;

  /** Optional: Start from specific slide number */
  startSlideNumber?: number;
}

/**
 * Payload for navigation commands
 */
export interface NavigateRequest {
  direction: NavigationDirection;
}

/**
 * Payload for slide data response
 */
export interface SlideDataResponse {
  slide: Slide;
  presentationName: string;
  currentSlideNumber: number;
  totalSlidesInPresentation: number;
  currentPresentationIndex: number;
  totalPresentations: number;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  isFirstPresentation: boolean;
  isLastPresentation: boolean;
}

/**
 * Payload for presentation ended event
 */
export interface PresentationEndedEvent {
  totalPresentationsShown: number;
  totalSlidesShown: number;
}

/**
 * Standard error codes for the application
 */
export enum ErrorCode {
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_CORRUPTED = 'FILE_CORRUPTED',

  // Presentation errors
  PRESENTATION_NOT_FOUND = 'PRESENTATION_NOT_FOUND',
  SLIDE_NOT_FOUND = 'SLIDE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',

  // State errors
  INVALID_STATE = 'INVALID_STATE',
  NO_PRESENTATIONS_LOADED = 'NO_PRESENTATIONS_LOADED',

  // Navigation errors
  NAVIGATION_BLOCKED = 'NAVIGATION_BLOCKED',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Application error class with error code support
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Application configuration
 */
export interface AppConfig {
  setupWindow: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
  presentWindow: {
    fullscreen: boolean;
    backgroundColor: string;
  };
  shortcuts: {
    nextSlide: string;
    previousSlide: string;
    nextPresentation: string;
    previousPresentation: string;
    exitPresentation: string;
  };
  slideRendering: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    format: 'png' | 'jpeg';
  };
}

/**
 * Slide rendering options
 */
export interface RenderOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'png' | 'jpeg';
}
