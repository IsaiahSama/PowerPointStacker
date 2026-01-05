# PowerPoint Stacker - Technical Specification Document

**Version:** 1.0.0
**Last Updated:** 2026-01-04
**Target Platforms:** Linux, Windows

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Structures & TypeScript Interfaces](#3-data-structures--typescript-interfaces)
4. [IPC API Specification](#4-ipc-api-specification)
5. [Main Process Responsibilities](#5-main-process-responsibilities)
6. [Renderer Process Responsibilities](#6-renderer-process-responsibilities)
7. [Preload Script Specifications](#7-preload-script-specifications)
8. [Core Features Implementation](#8-core-features-implementation)
9. [Window Management](#9-window-management)
10. [Error Handling](#10-error-handling)
11. [Platform Considerations](#11-platform-considerations)
12. [Code Examples](#12-code-examples)

---

## 1. System Architecture Overview

### 1.1 High-Level Component Architecture

PowerPoint Stacker follows the Electron multi-process architecture pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Main Process                            │
│  - Node.js runtime                                              │
│  - Presentation file management (PPTX/ODP parsing)              │
│  - Window lifecycle management                                  │
│  - Global keyboard shortcut handling                            │
│  - Application state management                                 │
│  - IPC message routing                                          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ IPC Communication (contextBridge)
                  │
        ┌─────────┴──────────┬──────────────────────┐
        │                    │                      │
┌───────▼────────┐  ┌────────▼─────────┐  ┌────────▼──────────┐
│  Setup Window  │  │ Present Window   │  │  Preload Script   │
│  (Renderer)    │  │  (Renderer)      │  │                   │
│                │  │                  │  │  Secure bridge    │
│  - File list   │  │  - Slide viewer  │  │  between main &   │
│  - Reordering  │  │  - Navigation    │  │  renderer         │
│  - Controls    │  │  - Fullscreen    │  │                   │
└────────────────┘  └──────────────────┘  └───────────────────┘
```

### 1.2 Process Architecture

#### Main Process
- **Runtime:** Node.js with full filesystem and native module access
- **Responsibilities:**
  - Parse and extract presentation files (PPTX/ODP)
  - Manage application windows (setup window, presentation window)
  - Handle global keyboard shortcuts
  - Store and manage presentation queue state
  - Serve slide images to renderer processes

#### Renderer Process(es)
- **Runtime:** Chromium with restricted access (context isolation enabled)
- **Responsibilities:**
  - Display user interface
  - Handle user interactions
  - Request data from main process via IPC
  - Render presentation slides
  - Manage local UI state

#### Preload Script
- **Runtime:** Privileged context between main and renderer
- **Responsibilities:**
  - Expose safe, whitelisted APIs to renderer
  - Validate and sanitize IPC messages
  - Provide type-safe communication layer

### 1.3 Data Flow Patterns

**File Loading Flow:**
```
User selects files → Renderer sends IPC → Main parses PPTX/ODP
→ Main extracts metadata → Main returns presentation data → Renderer updates UI
```

**Slide Navigation Flow:**
```
User clicks next/prev → Renderer sends navigation event → Main updates state
→ Main sends slide data → Renderer displays slide
```

**Presentation Transition Flow:**
```
Last slide reached → User clicks next → Main detects end of presentation
→ Main loads next presentation → Main sends first slide → Renderer updates
```

### 1.4 Security Model

- **Context Isolation:** Enabled to prevent renderer from accessing Node.js/Electron APIs directly
- **Node Integration:** Disabled in renderer processes
- **Sandbox:** Enabled for renderer processes
- **IPC Validation:** All messages validated and sanitized in preload script
- **File Access:** Only main process can access filesystem

---

## 2. Technology Stack

### 2.1 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^39.2.7 | Application framework |
| typescript | ~4.5.4 | Type safety and development |
| vite | ^5.4.21 | Build tool and dev server |

### 2.2 Required Additional Dependencies

The following packages must be installed for full functionality:

#### Presentation Processing
```json
{
  "pizzip": "^3.1.7",
  "officegen": "^0.6.5",
  "jszip": "^3.10.1",
  "xml2js": "^0.6.2"
}
```

**Purpose:** Parse PPTX files (which are ZIP archives containing XML) and extract:
- Slide count
- Slide images/thumbnails
- Presentation metadata

**Alternative for ODP:**
```json
{
  "decompress": "^4.2.1",
  "fast-xml-parser": "^4.3.6"
}
```

#### Image Processing
```json
{
  "sharp": "^0.33.5"
}
```

**Purpose:** Convert slide XML/vector data to displayable images, resize thumbnails, optimize performance

#### UI Framework (Renderer)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0"
}
```

**OR** (Alternative - simpler, lighter)

```json
{
  "lit": "^3.1.0"
}
```

**Note for Developers:** The UI Developer should choose either React (more familiar, rich ecosystem) or Lit (web components, lighter). The specification supports both approaches.

#### State Management (if using React)
```json
{
  "zustand": "^4.5.0"
}
```

**Purpose:** Lightweight state management for UI, manages:
- Current presentation queue
- Current slide index
- Presentation mode state

#### Drag and Drop (for reordering)
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0"
}
```

**Purpose:** Enable drag-and-drop reordering of presentations in setup window

#### Styling
```json
{
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.17",
  "postcss": "^8.4.33"
}
```

**OR** (vanilla CSS with modern features is acceptable)

### 2.3 Development Dependencies

```json
{
  "@electron-forge/cli": "^7.10.2",
  "@electron-forge/maker-deb": "^7.10.2",
  "@electron-forge/maker-rpm": "^7.10.2",
  "@electron-forge/maker-squirrel": "^7.10.2",
  "@electron-forge/plugin-vite": "^7.10.2",
  "eslint": "^8.57.1",
  "@typescript-eslint/eslint-plugin": "^5.62.0"
}
```

---

## 3. Data Structures & TypeScript Interfaces

All TypeScript interfaces should be defined in `/src/common/types.ts` for sharing between main and renderer processes.

### 3.1 Core Type Definitions

```typescript
/**
 * Unique identifier for presentations and slides
 */
type UUID = string;

/**
 * Represents a single presentation file
 */
interface PresentationFile {
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
interface Slide {
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
interface PresentationQueue {
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
enum NavigationDirection {
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
enum AppMode {
  SETUP = 'setup',
  PRESENTING = 'presenting'
}
```

### 3.2 IPC Message Payloads

```typescript
/**
 * Generic IPC response wrapper
 */
interface IPCResponse<T = unknown> {
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
interface AddPresentationsRequest {
  /** Array of absolute file paths */
  filePaths: string[];
}

interface AddPresentationsResponse {
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
interface RemovePresentationRequest {
  presentationId: UUID;
}

/**
 * Payload for reordering presentations
 */
interface ReorderPresentationsRequest {
  /** New order of presentation IDs */
  order: UUID[];
}

/**
 * Payload for starting presentation mode
 */
interface StartPresentationRequest {
  /** Optional: Start from specific presentation ID */
  startPresentationId?: UUID;

  /** Optional: Start from specific slide number */
  startSlideNumber?: number;
}

/**
 * Payload for navigation commands
 */
interface NavigateRequest {
  direction: NavigationDirection;
}

/**
 * Payload for slide data response
 */
interface SlideDataResponse {
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
interface PresentationEndedEvent {
  totalPresentationsShown: number;
  totalSlidesShown: number;
}
```

### 3.3 Error Codes

```typescript
/**
 * Standard error codes for the application
 */
enum ErrorCode {
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
```

### 3.4 Configuration Types

```typescript
/**
 * Application configuration
 */
interface AppConfig {
  /** Window dimensions for setup mode */
  setupWindow: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };

  /** Window dimensions for presentation mode */
  presentWindow: {
    fullscreen: boolean;
    backgroundColor: string;
  };

  /** Keyboard shortcuts */
  shortcuts: {
    nextSlide: string; // 'Right' or 'ArrowRight'
    previousSlide: string; // 'Left' or 'ArrowLeft'
    nextPresentation: string; // 'Control+PageDown'
    previousPresentation: string; // 'Control+PageUp'
    exitPresentation: string; // 'Escape'
  };

  /** Slide rendering options */
  slideRendering: {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0-100
    format: 'png' | 'jpeg';
  };
}
```

---

## 4. IPC API Specification

All IPC channels follow the namespace pattern: `domain:action`. This prevents naming conflicts and provides clear organization.

### 4.1 Presentation Management Channels

#### `presentation:add`
**Direction:** Renderer → Main
**Purpose:** Add one or more presentation files to the queue

**Request:**
```typescript
{
  filePaths: string[] // Absolute paths to PPTX/ODP files
}
```

**Response:**
```typescript
IPCResponse<AddPresentationsResponse>
```

**Example:**
```typescript
// Renderer
const result = await window.electronAPI.addPresentations({
  filePaths: ['/home/user/presentation1.pptx', '/home/user/slides.odp']
});

if (result.success) {
  console.log('Added:', result.data.added);
  console.log('Failed:', result.data.failed);
}
```

**Error Cases:**
- File doesn't exist: `FILE_NOT_FOUND`
- File is not PPTX/ODP: `INVALID_FILE_FORMAT`
- File is corrupted: `FILE_CORRUPTED`
- Read permission denied: `FILE_READ_ERROR`

---

#### `presentation:remove`
**Direction:** Renderer → Main
**Purpose:** Remove a presentation from the queue

**Request:**
```typescript
{
  presentationId: UUID
}
```

**Response:**
```typescript
IPCResponse<void>
```

**Error Cases:**
- Presentation not found: `PRESENTATION_NOT_FOUND`
- Cannot remove while presenting: `INVALID_STATE`

---

#### `presentation:reorder`
**Direction:** Renderer → Main
**Purpose:** Reorder presentations in the queue

**Request:**
```typescript
{
  order: UUID[] // New order of presentation IDs
}
```

**Response:**
```typescript
IPCResponse<void>
```

**Error Cases:**
- Invalid presentation ID in order: `PRESENTATION_NOT_FOUND`
- Missing presentation IDs: `INVALID_STATE`

---

#### `presentation:getQueue`
**Direction:** Renderer → Main
**Purpose:** Get current presentation queue state

**Request:**
```typescript
void
```

**Response:**
```typescript
IPCResponse<PresentationQueue>
```

---

#### `presentation:clear`
**Direction:** Renderer → Main
**Purpose:** Clear all presentations from queue

**Request:**
```typescript
void
```

**Response:**
```typescript
IPCResponse<void>
```

**Error Cases:**
- Cannot clear while presenting: `INVALID_STATE`

---

### 4.2 Presentation Mode Channels

#### `present:start`
**Direction:** Renderer → Main
**Purpose:** Start presentation mode (opens fullscreen window)

**Request:**
```typescript
{
  startPresentationId?: UUID;
  startSlideNumber?: number;
}
```

**Response:**
```typescript
IPCResponse<SlideDataResponse>
```

**Error Cases:**
- No presentations in queue: `NO_PRESENTATIONS_LOADED`
- Invalid presentation ID: `PRESENTATION_NOT_FOUND`
- Invalid slide number: `SLIDE_NOT_FOUND`

**Side Effects:**
- Creates and shows presentation window in fullscreen
- Hides setup window
- Loads first slide of first presentation (or specified slide)

---

#### `present:stop`
**Direction:** Renderer → Main (or Main → Renderer)
**Purpose:** Exit presentation mode and return to setup

**Request:**
```typescript
void
```

**Response:**
```typescript
IPCResponse<void>
```

**Side Effects:**
- Closes presentation window
- Shows setup window
- Resets current presentation/slide state

---

#### `present:navigate`
**Direction:** Renderer → Main
**Purpose:** Navigate between slides/presentations

**Request:**
```typescript
{
  direction: NavigationDirection
}
```

**Response:**
```typescript
IPCResponse<SlideDataResponse>
```

**Error Cases:**
- Already at first slide (PREVIOUS): `NAVIGATION_BLOCKED`
- Already at last slide (NEXT): Returns `presentation:ended` event

**Special Behavior:**
- When at last slide of a presentation and direction is NEXT:
  - If there's a next presentation: Load first slide of next presentation
  - If this is the last presentation: Emit `presentation:ended` event

---

#### `present:getCurrentSlide`
**Direction:** Renderer → Main
**Purpose:** Get current slide data

**Request:**
```typescript
void
```

**Response:**
```typescript
IPCResponse<SlideDataResponse>
```

---

### 4.3 Event Channels (Main → Renderer)

These channels use `send` pattern (main process pushes to renderer).

#### `presentation:queueUpdated`
**Direction:** Main → Renderer
**Purpose:** Notify renderer that queue has changed

**Payload:**
```typescript
PresentationQueue
```

**Trigger Conditions:**
- Presentation added
- Presentation removed
- Presentations reordered

---

#### `presentation:ended`
**Direction:** Main → Renderer
**Purpose:** Notify that all presentations have been shown

**Payload:**
```typescript
PresentationEndedEvent
```

**Trigger Conditions:**
- User navigates past last slide of last presentation

---

#### `slide:changed`
**Direction:** Main → Renderer
**Purpose:** Notify that slide has changed (for multi-window sync if needed)

**Payload:**
```typescript
SlideDataResponse
```

---

### 4.4 File Dialog Channels

#### `dialog:openFiles`
**Direction:** Renderer → Main
**Purpose:** Open native file picker dialog

**Request:**
```typescript
void
```

**Response:**
```typescript
IPCResponse<{
  filePaths: string[];
  canceled: boolean;
}>
```

**Dialog Options:**
```typescript
{
  title: 'Select Presentation Files',
  filters: [
    { name: 'Presentations', extensions: ['pptx', 'odp'] },
    { name: 'PowerPoint', extensions: ['pptx'] },
    { name: 'OpenDocument', extensions: ['odp'] }
  ],
  properties: ['openFile', 'multiSelections']
}
```

---

## 5. Main Process Responsibilities

### 5.1 File Structure

```
src/main/
├── index.ts                    # Entry point, app lifecycle
├── windowManager.ts            # Window creation and management
├── presentationManager.ts      # Presentation queue and state
├── presentationParser.ts       # PPTX/ODP parsing
├── slideRenderer.ts            # Convert slides to images
├── ipcHandlers.ts              # IPC channel handlers
├── keyboardShortcuts.ts        # Global shortcut registration
└── config.ts                   # Application configuration
```

### 5.2 Core Modules

#### 5.2.1 Window Manager (`windowManager.ts`)

**Responsibilities:**
- Create and manage setup window
- Create and manage presentation window
- Handle window lifecycle events
- Manage window state transitions

**Key Functions:**

```typescript
class WindowManager {
  private setupWindow: BrowserWindow | null = null;
  private presentWindow: BrowserWindow | null = null;

  /**
   * Create the setup window (initial window for file management)
   */
  createSetupWindow(): BrowserWindow;

  /**
   * Create the presentation window (fullscreen for presenting)
   */
  createPresentationWindow(): BrowserWindow;

  /**
   * Show setup window, hide presentation window
   */
  switchToSetupMode(): void;

  /**
   * Show presentation window fullscreen, hide setup window
   */
  switchToPresentationMode(): void;

  /**
   * Close all windows
   */
  closeAllWindows(): void;

  /**
   * Get reference to setup window
   */
  getSetupWindow(): BrowserWindow | null;

  /**
   * Get reference to presentation window
   */
  getPresentationWindow(): BrowserWindow | null;
}
```

**Window Configuration:**

Setup Window:
```typescript
{
  width: 900,
  height: 700,
  minWidth: 600,
  minHeight: 400,
  title: 'PowerPoint Stacker - Setup',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  }
}
```

Presentation Window:
```typescript
{
  fullscreen: true,
  title: 'PowerPoint Stacker - Presentation',
  backgroundColor: '#000000',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  },
  // Allow passthrough for slide interaction
  transparent: false,
  frame: false
}
```

---

#### 5.2.2 Presentation Manager (`presentationManager.ts`)

**Responsibilities:**
- Maintain presentation queue state
- Track current presentation and slide
- Handle navigation logic
- Validate state transitions

**Key Functions:**

```typescript
class PresentationManager {
  private queue: PresentationQueue;

  /**
   * Add presentations to queue
   */
  async addPresentations(filePaths: string[]): Promise<AddPresentationsResponse>;

  /**
   * Remove presentation from queue
   */
  removePresentation(presentationId: UUID): void;

  /**
   * Reorder presentations
   */
  reorderPresentations(newOrder: UUID[]): void;

  /**
   * Clear all presentations
   */
  clearQueue(): void;

  /**
   * Get current queue state
   */
  getQueue(): PresentationQueue;

  /**
   * Start presentation mode
   */
  startPresentation(
    startPresentationId?: UUID,
    startSlideNumber?: number
  ): SlideDataResponse;

  /**
   * Stop presentation mode
   */
  stopPresentation(): void;

  /**
   * Navigate to next/previous slide or presentation
   */
  navigate(direction: NavigationDirection): SlideDataResponse | null;

  /**
   * Get current slide data
   */
  getCurrentSlide(): SlideDataResponse | null;

  /**
   * Check if at end of all presentations
   */
  isAtEnd(): boolean;

  /**
   * Check if at beginning of all presentations
   */
  isAtBeginning(): boolean;
}
```

**Navigation Logic:**

```typescript
private navigate(direction: NavigationDirection): SlideDataResponse | null {
  if (!this.queue.currentPresentationId || !this.queue.currentSlideNumber) {
    throw new Error('Not in presentation mode');
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
  }

  return this.getCurrentSlide();
}
```

---

#### 5.2.3 Presentation Parser (`presentationParser.ts`)

**Responsibilities:**
- Parse PPTX and ODP files
- Extract presentation metadata
- Extract slide images
- Cache parsed data

**Key Functions:**

```typescript
class PresentationParser {
  /**
   * Parse a presentation file and extract metadata
   */
  async parsePresentationFile(filePath: string): Promise<PresentationFile>;

  /**
   * Extract all slides from presentation as images
   */
  async extractSlides(presentationId: UUID): Promise<Slide[]>;

  /**
   * Extract a specific slide as image
   */
  async extractSlide(presentationId: UUID, slideNumber: number): Promise<Slide>;

  /**
   * Validate file format
   */
  isValidPresentationFile(filePath: string): boolean;

  /**
   * Get slide count without full parsing
   */
  async getSlideCount(filePath: string): Promise<number>;
}
```

**PPTX Parsing Strategy:**

1. Validate file exists and has .pptx extension
2. Open as ZIP archive using `pizzip` or `jszip`
3. Read `ppt/presentation.xml` to get slide count
4. For each slide:
   - Read `ppt/slides/slide{N}.xml`
   - Extract slide dimensions from XML
   - Render slide to image using slide renderer
5. Extract metadata (title, author if available)

**ODP Parsing Strategy:**

1. Validate file exists and has .odp extension
2. Open as ZIP archive
3. Read `content.xml` to get slide information
4. Parse slide structure from XML
5. Render slides to images

**Error Handling:**
- File not found: Throw `FILE_NOT_FOUND`
- Invalid ZIP: Throw `INVALID_FILE_FORMAT`
- Missing required XML files: Throw `FILE_CORRUPTED`
- XML parse error: Throw `PARSE_ERROR`

---

#### 5.2.4 Slide Renderer (`slideRenderer.ts`)

**Responsibilities:**
- Convert slide XML/data to displayable images
- Optimize image size and quality
- Cache rendered slides

**Key Functions:**

```typescript
class SlideRenderer {
  /**
   * Render slide to image buffer
   */
  async renderSlide(
    slideXml: string,
    format: 'pptx' | 'odp',
    options?: RenderOptions
  ): Promise<Buffer>;

  /**
   * Convert image buffer to base64 data URL
   */
  bufferToDataURL(buffer: Buffer, mimeType: string): string;

  /**
   * Optimize image for display
   */
  async optimizeImage(
    buffer: Buffer,
    maxWidth: number,
    maxHeight: number
  ): Promise<Buffer>;
}

interface RenderOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'png' | 'jpeg';
}
```

**Rendering Approach:**

Option 1 (Recommended): Use LibreOffice headless conversion
```bash
libreoffice --headless --convert-to pdf --outdir /tmp presentation.pptx
pdftoppm -png -r 150 presentation.pdf slide
```

Option 2: Use image extraction from PPTX
- Extract embedded images from `ppt/media/` folder
- Composite text and shapes using canvas or sharp

Option 3: Use presentation rendering library
- Research and select appropriate library for Node.js

**Note for Service Developer:** Choose the most reliable approach for both Linux and Windows. LibreOffice CLI is cross-platform but requires LibreOffice installation. Direct image extraction is faster but may miss text/formatting.

---

#### 5.2.5 IPC Handlers (`ipcHandlers.ts`)

**Responsibilities:**
- Register all IPC channel handlers
- Validate incoming requests
- Call appropriate service methods
- Format responses
- Handle errors

**Structure:**

```typescript
export function registerIPCHandlers(
  presentationManager: PresentationManager,
  windowManager: WindowManager
): void {
  // Presentation management
  ipcMain.handle('presentation:add', async (event, request: AddPresentationsRequest) => {
    try {
      const result = await presentationManager.addPresentations(request.filePaths);
      return { success: true, data: result };
    } catch (error) {
      return formatError(error);
    }
  });

  ipcMain.handle('presentation:remove', async (event, request: RemovePresentationRequest) => {
    try {
      presentationManager.removePresentation(request.presentationId);
      return { success: true };
    } catch (error) {
      return formatError(error);
    }
  });

  // ... other handlers
}

function formatError(error: unknown): IPCResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
  }

  return {
    success: false,
    error: {
      code: ErrorCode.UNKNOWN_ERROR,
      message: String(error)
    }
  };
}
```

---

#### 5.2.6 Keyboard Shortcuts (`keyboardShortcuts.ts`)

**Responsibilities:**
- Register global keyboard shortcuts
- Handle shortcut events
- Trigger navigation commands

**Key Shortcuts:**

| Shortcut | Action | Context |
|----------|--------|---------|
| `ArrowRight` | Next slide | Presentation mode |
| `ArrowLeft` | Previous slide | Presentation mode |
| `Control+PageDown` | Next presentation | Presentation mode |
| `Control+PageUp` | Previous presentation | Presentation mode |
| `Escape` | Exit presentation mode | Presentation mode |
| `Home` | First slide of presentation | Presentation mode |
| `End` | Last slide of presentation | Presentation mode |

**Implementation:**

```typescript
export function registerKeyboardShortcuts(
  presentationManager: PresentationManager,
  windowManager: WindowManager
): void {
  const presentWindow = windowManager.getPresentationWindow();

  if (presentWindow) {
    presentWindow.webContents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;

      switch (input.key) {
        case 'ArrowRight':
          handleNavigation(NavigationDirection.NEXT);
          event.preventDefault();
          break;

        case 'ArrowLeft':
          handleNavigation(NavigationDirection.PREVIOUS);
          event.preventDefault();
          break;

        case 'PageDown':
          if (input.control) {
            handleNavigation(NavigationDirection.NEXT_PRESENTATION);
            event.preventDefault();
          }
          break;

        case 'PageUp':
          if (input.control) {
            handleNavigation(NavigationDirection.PREVIOUS_PRESENTATION);
            event.preventDefault();
          }
          break;

        case 'Escape':
          presentationManager.stopPresentation();
          windowManager.switchToSetupMode();
          event.preventDefault();
          break;
      }
    });
  }
}

function handleNavigation(direction: NavigationDirection): void {
  const result = presentationManager.navigate(direction);

  if (result === null) {
    // End of presentations reached
    const presentWindow = windowManager.getPresentationWindow();
    presentWindow?.webContents.send('presentation:ended', {
      totalPresentationsShown: presentationManager.getQueue().order.length,
      totalSlidesShown: calculateTotalSlides(presentationManager.getQueue())
    });
  } else {
    // Send updated slide data
    const presentWindow = windowManager.getPresentationWindow();
    presentWindow?.webContents.send('slide:changed', result);
  }
}
```

---

### 5.3 Application Lifecycle

**Initialization Sequence:**

```typescript
// src/main/index.ts

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './windowManager';
import { PresentationManager } from './presentationManager';
import { registerIPCHandlers } from './ipcHandlers';

let windowManager: WindowManager;
let presentationManager: PresentationManager;

app.on('ready', () => {
  // Initialize managers
  presentationManager = new PresentationManager();
  windowManager = new WindowManager();

  // Register IPC handlers
  registerIPCHandlers(presentationManager, windowManager);

  // Create setup window
  windowManager.createSetupWindow();
});

// Quit when all windows are closed (per requirements)
app.on('window-all-closed', () => {
  app.quit();
});

// On macOS, quit when all windows closed (override default behavior)
app.on('window-all-closed', () => {
  app.quit();
});
```

---

## 6. Renderer Process Responsibilities

### 6.1 File Structure

```
src/renderer/
├── index.ts                    # Entry point
├── index.html                  # Main HTML template
├── styles/
│   └── main.css                # Global styles
├── components/
│   ├── SetupView/
│   │   ├── SetupView.tsx       # Main setup screen
│   │   ├── FileList.tsx        # List of loaded presentations
│   │   ├── FileListItem.tsx    # Single presentation item
│   │   ├── AddFilesButton.tsx  # Button to open file dialog
│   │   └── StartButton.tsx     # Start presentation button
│   └── PresentView/
│       ├── PresentView.tsx     # Presentation display screen
│       ├── SlideDisplay.tsx    # Slide image display
│       ├── NavigationBar.tsx   # Navigation controls
│       ├── ProgressBar.tsx     # Slide/presentation progress
│       └── EndScreen.tsx       # Final screen after last presentation
├── state/
│   └── store.ts                # State management
└── utils/
    └── api.ts                  # IPC API wrapper
```

### 6.2 UI Components

#### 6.2.1 Setup View

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  PowerPoint Stacker - Setup                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  + Add Presentations                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Loaded Presentations (3)                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. ≡ presentation1.pptx         (25 slides)  X │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 2. ≡ quarterly-results.pptx     (15 slides)  X │    │
│  ├────────────────────────────────────────────────┤    │
│  │ 3. ≡ project-overview.odp       (10 slides)  X │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Total: 3 presentations, 50 slides                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │        Start Presentation (Fullscreen)         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**SetupView.tsx**
- Main container for setup mode
- Manages local UI state
- Handles drag-and-drop file uploads
- Communicates with main process via IPC

```typescript
interface SetupViewProps {}

export function SetupView() {
  const [presentations, setPresentations] = useState<PresentationFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial queue on mount
  useEffect(() => {
    loadQueue();

    // Listen for queue updates
    window.electronAPI.onQueueUpdated((queue: PresentationQueue) => {
      setPresentations(queue.order.map(id => queue.presentations[id]));
    });
  }, []);

  const loadQueue = async () => {
    const response = await window.electronAPI.getQueue();
    if (response.success) {
      setPresentations(
        response.data.order.map(id => response.data.presentations[id])
      );
    }
  };

  const handleAddFiles = async () => {
    const result = await window.electronAPI.openFileDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      setIsLoading(true);
      await window.electronAPI.addPresentations({ filePaths: result.filePaths });
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: UUID) => {
    await window.electronAPI.removePresentation({ presentationId: id });
  };

  const handleReorder = async (newOrder: UUID[]) => {
    await window.electronAPI.reorderPresentations({ order: newOrder });
  };

  const handleStart = async () => {
    if (presentations.length === 0) return;
    await window.electronAPI.startPresentation({});
  };

  return (
    <div className="setup-view">
      <AddFilesButton onClick={handleAddFiles} disabled={isLoading} />
      <FileList
        presentations={presentations}
        onRemove={handleRemove}
        onReorder={handleReorder}
      />
      <StartButton
        onClick={handleStart}
        disabled={presentations.length === 0}
      />
    </div>
  );
}
```

**FileList.tsx**
- Draggable list of presentations
- Shows presentation name, slide count
- Remove button for each item

```typescript
interface FileListProps {
  presentations: PresentationFile[];
  onRemove: (id: UUID) => void;
  onReorder: (newOrder: UUID[]) => void;
}

export function FileList({ presentations, onRemove, onReorder }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = presentations.findIndex(p => p.id === active.id);
      const newIndex = presentations.findIndex(p => p.id === over.id);
      const newOrder = arrayMove(presentations, oldIndex, newIndex).map(p => p.id);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={presentations.map(p => p.id)}>
        {presentations.map((presentation, index) => (
          <FileListItem
            key={presentation.id}
            presentation={presentation}
            index={index}
            onRemove={() => onRemove(presentation.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

#### 6.2.2 Presentation View

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│                  [Slide Image Display]                  │
│                   (centered, scaled)                    │
│                                                          │
│                                                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  ◀ Prev          presentation1.pptx (5/25)         Next ▶│
│  ───────────────────────────────────────────────────────│
│                 [Presentation 1 of 3]                    │
└─────────────────────────────────────────────────────────┘
```

**Component Specifications:**

**PresentView.tsx**
- Main container for presentation mode
- Listens for keyboard events
- Displays current slide
- Shows navigation controls

```typescript
interface PresentViewProps {}

export function PresentView() {
  const [slideData, setSlideData] = useState<SlideDataResponse | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(false);

  useEffect(() => {
    // Listen for slide changes
    window.electronAPI.onSlideChanged((data: SlideDataResponse) => {
      setSlideData(data);
      setShowEndScreen(false);
    });

    // Listen for presentation end
    window.electronAPI.onPresentationEnded((data: PresentationEndedEvent) => {
      setShowEndScreen(true);
    });

    // Load current slide on mount
    loadCurrentSlide();
  }, []);

  const loadCurrentSlide = async () => {
    const response = await window.electronAPI.getCurrentSlide();
    if (response.success) {
      setSlideData(response.data);
    }
  };

  const handleNavigate = async (direction: NavigationDirection) => {
    const response = await window.electronAPI.navigate({ direction });
    if (response.success && response.data) {
      setSlideData(response.data);
    }
  };

  const handleExit = async () => {
    await window.electronAPI.stopPresentation();
  };

  if (showEndScreen) {
    return <EndScreen onExit={handleExit} />;
  }

  if (!slideData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="present-view">
      <SlideDisplay slide={slideData.slide} />
      <NavigationBar
        slideData={slideData}
        onNavigate={handleNavigate}
      />
      <ProgressBar slideData={slideData} />
    </div>
  );
}
```

**SlideDisplay.tsx**
- Displays slide image centered and scaled
- Handles image loading states
- Allows passthrough clicks

```typescript
interface SlideDisplayProps {
  slide: Slide;
}

export function SlideDisplay({ slide }: SlideDisplayProps) {
  return (
    <div className="slide-display">
      <img
        src={slide.imageData}
        alt={`Slide ${slide.slideNumber}`}
        className="slide-image"
      />
    </div>
  );
}
```

**Styling (CSS):**
```css
.slide-display {
  width: 100vw;
  height: calc(100vh - 80px); /* Reserve space for navigation */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.slide-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
```

**NavigationBar.tsx**
- Previous/Next buttons
- Current slide indicator
- Keyboard hint

```typescript
interface NavigationBarProps {
  slideData: SlideDataResponse;
  onNavigate: (direction: NavigationDirection) => void;
}

export function NavigationBar({ slideData, onNavigate }: NavigationBarProps) {
  return (
    <div className="navigation-bar">
      <button
        onClick={() => onNavigate(NavigationDirection.PREVIOUS)}
        disabled={slideData.isFirstSlide && slideData.isFirstPresentation}
      >
        ◀ Previous
      </button>

      <div className="slide-info">
        {slideData.presentationName} ({slideData.currentSlideNumber}/{slideData.totalSlidesInPresentation})
      </div>

      <button
        onClick={() => onNavigate(NavigationDirection.NEXT)}
      >
        Next ▶
      </button>
    </div>
  );
}
```

**EndScreen.tsx**
- Shown after last slide of last presentation
- Options to return to setup or close app

```typescript
interface EndScreenProps {
  onExit: () => void;
}

export function EndScreen({ onExit }: EndScreenProps) {
  const handleClose = () => {
    window.electronAPI.quitApp();
  };

  return (
    <div className="end-screen">
      <h1>Presentation Complete</h1>
      <p>You have reached the end of all presentations.</p>
      <div className="actions">
        <button onClick={onExit}>Return to Setup</button>
        <button onClick={handleClose}>Close Application</button>
      </div>
    </div>
  );
}
```

---

### 6.3 State Management

If using React with Zustand:

```typescript
// src/renderer/state/store.ts

import create from 'zustand';

interface AppState {
  mode: AppMode;
  presentations: PresentationFile[];
  currentSlideData: SlideDataResponse | null;

  setMode: (mode: AppMode) => void;
  setPresentations: (presentations: PresentationFile[]) => void;
  setCurrentSlideData: (data: SlideDataResponse | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: AppMode.SETUP,
  presentations: [],
  currentSlideData: null,

  setMode: (mode) => set({ mode }),
  setPresentations: (presentations) => set({ presentations }),
  setCurrentSlideData: (data) => set({ currentSlideData: data })
}));
```

---

## 7. Preload Script Specifications

### 7.1 Purpose and Security

The preload script runs in a privileged context and exposes a limited, type-safe API to the renderer process. This ensures:
- Renderer cannot access Node.js or Electron APIs directly
- All IPC communication is validated
- Security vulnerabilities are minimized

### 7.2 Implementation

```typescript
// src/common/preload.ts

import { contextBridge, ipcRenderer } from 'electron';
import type {
  IPCResponse,
  AddPresentationsRequest,
  AddPresentationsResponse,
  RemovePresentationRequest,
  ReorderPresentationsRequest,
  StartPresentationRequest,
  NavigateRequest,
  SlideDataResponse,
  PresentationQueue,
  PresentationEndedEvent,
  NavigationDirection
} from './types';

/**
 * ElectronAPI exposed to renderer process
 */
interface ElectronAPI {
  // Presentation management
  addPresentations(request: AddPresentationsRequest): Promise<IPCResponse<AddPresentationsResponse>>;
  removePresentation(request: RemovePresentationRequest): Promise<IPCResponse<void>>;
  reorderPresentations(request: ReorderPresentationsRequest): Promise<IPCResponse<void>>;
  getQueue(): Promise<IPCResponse<PresentationQueue>>;
  clearQueue(): Promise<IPCResponse<void>>;

  // Presentation mode
  startPresentation(request: StartPresentationRequest): Promise<IPCResponse<SlideDataResponse>>;
  stopPresentation(): Promise<IPCResponse<void>>;
  navigate(request: NavigateRequest): Promise<IPCResponse<SlideDataResponse>>;
  getCurrentSlide(): Promise<IPCResponse<SlideDataResponse>>;

  // File dialog
  openFileDialog(): Promise<IPCResponse<{ filePaths: string[]; canceled: boolean }>>;

  // Event listeners
  onQueueUpdated(callback: (queue: PresentationQueue) => void): void;
  onSlideChanged(callback: (data: SlideDataResponse) => void): void;
  onPresentationEnded(callback: (data: PresentationEndedEvent) => void): void;

  // Utility
  quitApp(): void;
}

// Expose protected API to renderer
const electronAPI: ElectronAPI = {
  // Presentation management
  addPresentations: (request) =>
    ipcRenderer.invoke('presentation:add', request),

  removePresentation: (request) =>
    ipcRenderer.invoke('presentation:remove', request),

  reorderPresentations: (request) =>
    ipcRenderer.invoke('presentation:reorder', request),

  getQueue: () =>
    ipcRenderer.invoke('presentation:getQueue'),

  clearQueue: () =>
    ipcRenderer.invoke('presentation:clear'),

  // Presentation mode
  startPresentation: (request) =>
    ipcRenderer.invoke('present:start', request),

  stopPresentation: () =>
    ipcRenderer.invoke('present:stop'),

  navigate: (request) =>
    ipcRenderer.invoke('present:navigate', request),

  getCurrentSlide: () =>
    ipcRenderer.invoke('present:getCurrentSlide'),

  // File dialog
  openFileDialog: () =>
    ipcRenderer.invoke('dialog:openFiles'),

  // Event listeners
  onQueueUpdated: (callback) => {
    ipcRenderer.on('presentation:queueUpdated', (_event, queue) => callback(queue));
  },

  onSlideChanged: (callback) => {
    ipcRenderer.on('slide:changed', (_event, data) => callback(data));
  },

  onPresentationEnded: (callback) => {
    ipcRenderer.on('presentation:ended', (_event, data) => callback(data));
  },

  // Utility
  quitApp: () => {
    ipcRenderer.send('app:quit');
  }
};

// Expose API to window object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### 7.3 Type Declarations

Create a type declaration file for renderer TypeScript:

```typescript
// src/renderer/types/electron.d.ts

import type { ElectronAPI } from '../../common/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## 8. Core Features Implementation

### 8.1 File Selection and Loading

**User Story:**
As a presenter, I want to select multiple PPTX or ODP files so that I can prepare a sequence of presentations.

**Acceptance Criteria:**
- User can click "Add Presentations" button
- Native file picker opens filtered to .pptx and .odp files
- User can select multiple files at once
- Selected files are parsed and added to the queue
- File list updates to show newly added presentations
- Error message shown if file parsing fails
- Duplicate files are allowed but get unique IDs

**UI Flow:**
1. User clicks "Add Presentations" button
2. Native file dialog opens
3. User selects one or more presentation files
4. Dialog closes, loading indicator appears
5. Files are processed in background
6. UI updates with new presentations
7. If errors occur, show error notification with failed files

**Main Process Implementation:**
```typescript
// In ipcHandlers.ts
ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Presentation Files',
    filters: [
      { name: 'Presentations', extensions: ['pptx', 'odp'] },
      { name: 'PowerPoint', extensions: ['pptx'] },
      { name: 'OpenDocument', extensions: ['odp'] }
    ],
    properties: ['openFile', 'multiSelections']
  });

  return {
    success: true,
    data: {
      filePaths: result.filePaths,
      canceled: result.canceled
    }
  };
});

// In presentationManager.ts
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
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Notify all windows of queue update
  this.broadcastQueueUpdate();

  return { added, failed };
}
```

**Error Cases:**
- File not found: Show "File not found: {filename}"
- Invalid format: Show "Invalid file format: {filename}. Only PPTX and ODP are supported."
- Corrupted file: Show "File is corrupted or unreadable: {filename}"
- Permission denied: Show "Permission denied reading: {filename}"

---

### 8.2 Presentation Reordering

**User Story:**
As a presenter, I want to reorder my presentations by dragging them so that I can control the presentation sequence.

**Acceptance Criteria:**
- User can drag presentations up or down in the list
- Visual feedback during drag (elevation, opacity)
- Order updates immediately when dropped
- Order persists when switching to presentation mode
- Cannot reorder during presentation mode

**UI Implementation:**
- Use `@dnd-kit/sortable` for drag-and-drop
- Show drag handle icon (≡) on each item
- Highlight drop zone during drag
- Animate reordering

**Main Process Implementation:**
```typescript
// In presentationManager.ts
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
  this.broadcastQueueUpdate();
}
```

---

### 8.3 Starting Presentation Mode

**User Story:**
As a presenter, I want to click a button to start presenting so that my slides appear in fullscreen.

**Acceptance Criteria:**
- "Start Presentation" button is disabled when no presentations loaded
- Clicking button transitions to fullscreen presentation window
- Setup window is hidden (not closed)
- First slide of first presentation is displayed
- Navigation controls are visible
- Button shows loading state while transitioning

**UI Flow:**
1. User clicks "Start Presentation"
2. Button shows loading state
3. IPC request sent to main process
4. Main process creates/shows presentation window
5. Main process hides setup window
6. Presentation window loads first slide
7. Navigation controls appear

**Main Process Implementation:**
```typescript
// In presentationManager.ts
startPresentation(
  startPresentationId?: UUID,
  startSlideNumber?: number
): SlideDataResponse {
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

  return this.getCurrentSlide()!;
}

// In windowManager.ts
switchToPresentationMode(): void {
  if (!this.presentWindow) {
    this.createPresentationWindow();
  }

  this.presentWindow!.show();
  this.presentWindow!.setFullScreen(true);

  if (this.setupWindow) {
    this.setupWindow.hide();
  }
}
```

---

### 8.4 Slide Navigation

**User Story:**
As a presenter, I want to navigate between slides using arrow keys or on-screen buttons so that I can control my presentation flow.

**Acceptance Criteria:**
- Right arrow or "Next" button advances to next slide
- Left arrow or "Previous" button goes to previous slide
- Navigation wraps between presentations seamlessly
- Previous button disabled on first slide of first presentation
- Reaching last slide of last presentation triggers end screen
- Current slide number updates in UI
- Keyboard shortcuts work even when buttons are not focused

**Navigation Matrix:**

| Current Position | Action | Result |
|------------------|--------|--------|
| Slide 5/10, Presentation 1/3 | Next | Slide 6/10, Presentation 1/3 |
| Slide 10/10, Presentation 1/3 | Next | Slide 1/15, Presentation 2/3 |
| Slide 1/10, Presentation 2/3 | Previous | Slide 10/10, Presentation 1/3 |
| Last slide of last presentation | Next | Show end screen |
| First slide of first presentation | Previous | No action |

**Main Process Implementation:**
```typescript
// Already shown in section 5.2.2 (Navigation Logic)
```

**Renderer Implementation:**
```typescript
// Keyboard event handling in PresentView.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        handleNavigate(NavigationDirection.NEXT);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        handleNavigate(NavigationDirection.PREVIOUS);
        e.preventDefault();
        break;
      case 'PageDown':
        if (e.ctrlKey) {
          handleNavigate(NavigationDirection.NEXT_PRESENTATION);
          e.preventDefault();
        }
        break;
      case 'PageUp':
        if (e.ctrlKey) {
          handleNavigate(NavigationDirection.PREVIOUS_PRESENTATION);
          e.preventDefault();
        }
        break;
      case 'Escape':
        handleExit();
        e.preventDefault();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

### 8.5 Presentation Transitions

**User Story:**
As a presenter, when I reach the end of one presentation, I want to seamlessly transition to the next presentation so that my audience doesn't notice a break.

**Acceptance Criteria:**
- No visible delay between presentations
- Slide counter resets to show new presentation's count
- Presentation name updates in UI
- Overall progress indicator updates
- Transition feels natural and automatic

**Implementation Notes:**
- Pre-load next presentation's first slide in background
- Update UI atomically (all elements at once)
- Maintain consistent transition animation

---

### 8.6 Special Keybinds

**User Story:**
As a presenter, I want special keyboard shortcuts to jump between presentations so that I can quickly navigate my content.

**Keybind Specification:**

| Keybind | Action | Description |
|---------|--------|-------------|
| `Ctrl+PageDown` | Jump to next presentation | Go to first slide of next presentation |
| `Ctrl+PageUp` | Jump to previous presentation | Go to first slide of previous presentation |
| `Home` | First slide | Jump to first slide of current presentation |
| `End` | Last slide | Jump to last slide of current presentation |
| `Escape` | Exit presentation | Return to setup mode |

**Behavior:**
- If already at last presentation, `Ctrl+PageDown` does nothing
- If already at first presentation, `Ctrl+PageUp` does nothing
- These shortcuts should work in addition to regular arrow key navigation

---

### 8.7 Slide Passthrough Interaction

**User Story:**
As a presenter, I want to be able to interact directly with slides (click links, play embedded videos) so that I can engage with interactive content.

**Acceptance Criteria:**
- Mouse clicks on slide area are passed through to slide content
- Links in slides are clickable
- Embedded videos can be played
- Navigation controls remain accessible
- Clicking outside slide area doesn't affect slide

**Implementation Approach:**

**Option 1: Render slides as HTML (Preferred)**
- Convert PPTX/ODP to HTML presentation
- Embed in iframe with full interactivity
- Allows true passthrough

**Option 2: Image-based with overlay**
- Render slides as images
- Detect clickable regions from presentation data
- Simulate click behavior

**Note for Service Developer:** Option 1 provides better user experience but is more complex. Consider using libraries like `reveal.js` or `impress.js` to render presentations if choosing this approach.

**Basic Implementation (Image-based):**
```typescript
// In SlideDisplay.tsx
export function SlideDisplay({ slide }: SlideDisplayProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Allow clicks to propagate to underlying content
    // This is mainly for future enhancements
    console.log('Slide clicked at:', e.clientX, e.clientY);
  };

  return (
    <div className="slide-display" onClick={handleClick}>
      <img
        src={slide.imageData}
        alt={`Slide ${slide.slideNumber}`}
        className="slide-image"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
}
```

---

### 8.8 End of Presentation Flow

**User Story:**
As a presenter, when I finish all presentations, I want clear options to either return to setup or close the application so that I can end my session gracefully.

**Acceptance Criteria:**
- After last slide of last presentation, clicking "Next" shows end screen
- End screen displays completion message
- "Return to Setup" button returns to setup window with queue intact
- "Close Application" button quits the application
- Pressing Escape also returns to setup
- End screen is visually distinct from presentation slides

**End Screen Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                   ✓ Presentation Complete               │
│                                                          │
│         You have reached the end of all presentations.  │
│                                                          │
│                    3 presentations shown                │
│                      50 slides total                    │
│                                                          │
│                                                          │
│         ┌──────────────────┐  ┌──────────────────┐     │
│         │ Return to Setup  │  │ Close Application│     │
│         └──────────────────┘  └──────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// In PresentView.tsx
const handleNavigate = async (direction: NavigationDirection) => {
  const response = await window.electronAPI.navigate({ direction });

  if (!response.success) {
    // Check if we've reached the end
    if (response.error?.code === 'NAVIGATION_BLOCKED') {
      // This shouldn't happen for NEXT direction
      return;
    }
  }

  if (response.data) {
    setSlideData(response.data);
  } else {
    // Null response means end of presentations
    setShowEndScreen(true);
  }
};
```

---

## 9. Window Management

### 9.1 Window Types

**Setup Window:**
- **Purpose:** File management and presentation queue configuration
- **Size:** 900x700px (resizable, min 600x400)
- **Frame:** Standard OS frame with title bar
- **Background:** Light/neutral color
- **Lifecycle:** Created on app start, hidden during presentation, shown when returning

**Presentation Window:**
- **Purpose:** Full-screen slide display
- **Size:** Fullscreen (native resolution)
- **Frame:** Frameless (no title bar)
- **Background:** Black
- **Lifecycle:** Created when entering presentation mode, hidden when returning to setup

### 9.2 Window Transitions

**Setup → Presentation:**
1. User clicks "Start Presentation"
2. Create presentation window (if not exists)
3. Load first slide into presentation window
4. Show presentation window
5. Set fullscreen mode
6. Hide setup window

**Presentation → Setup:**
1. User clicks "Exit" or presses Escape
2. Hide presentation window (keep window object for reuse)
3. Show setup window
4. Reset presentation state

### 9.3 Multi-Monitor Considerations

**Default Behavior:**
- Presentation window opens on primary display
- Setup window remains on display where it was opened

**Future Enhancement:**
- Allow user to select which display for presentation
- Remember last used display preference

### 9.4 Window State Persistence

**Setup Window:**
- Save window position and size on close
- Restore position and size on next launch
- Store in electron-store or localStorage

**Implementation:**
```typescript
// In windowManager.ts
createSetupWindow(): BrowserWindow {
  // Load saved bounds
  const savedBounds = store.get('setupWindowBounds', {
    width: 900,
    height: 700
  });

  this.setupWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: 600,
    minHeight: 400,
    // ... other options
  });

  // Save bounds on close
  this.setupWindow.on('close', () => {
    if (this.setupWindow) {
      store.set('setupWindowBounds', this.setupWindow.getBounds());
    }
  });

  return this.setupWindow;
}
```

---

## 10. Error Handling

### 10.1 Error Categories

**File Errors:**
- File not found
- Invalid file format
- Corrupted file
- Permission denied

**Presentation Errors:**
- Presentation not found in queue
- Slide not found
- Parse error

**State Errors:**
- Invalid state transition
- No presentations loaded
- Navigation blocked

**System Errors:**
- Out of memory
- Disk full
- Unknown error

### 10.2 Error Display Strategy

**Toast Notifications (Non-blocking):**
- Use for non-critical errors
- Auto-dismiss after 5 seconds
- Examples: "Failed to load presentation1.pptx"

**Modal Dialogs (Blocking):**
- Use for critical errors requiring user action
- Examples: "Cannot start presentation: No files loaded"

**Inline Errors:**
- Show next to relevant UI element
- Examples: Red text under failed file in list

### 10.3 Error Recovery

**Graceful Degradation:**
- If one presentation fails to load, continue with others
- If slide rendering fails, show placeholder with error message
- Never crash the entire application

**User Guidance:**
```typescript
// Error message examples
const errorMessages: Record<ErrorCode, string> = {
  FILE_NOT_FOUND: 'The file could not be found. It may have been moved or deleted.',
  INVALID_FILE_FORMAT: 'This file format is not supported. Please use PPTX or ODP files.',
  FILE_CORRUPTED: 'This file appears to be corrupted and cannot be opened.',
  FILE_READ_ERROR: 'Permission denied. Please check file permissions and try again.',
  PRESENTATION_NOT_FOUND: 'The requested presentation is no longer in the queue.',
  NO_PRESENTATIONS_LOADED: 'Please add at least one presentation before starting.',
  PARSE_ERROR: 'An error occurred while reading the presentation file.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};
```

### 10.4 Logging

**Log Levels:**
- ERROR: Critical errors requiring attention
- WARN: Warnings that don't prevent functionality
- INFO: General information about operations
- DEBUG: Detailed debugging information

**Log Location:**
- Main process: Console and file (`~/.config/powerpointstacker/logs/main.log`)
- Renderer process: Console (DevTools)

**Implementation:**
```typescript
// In main process
import log from 'electron-log';

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

log.info('Application started');
log.error('Failed to parse presentation:', error);
```

---

## 11. Platform Considerations

### 11.1 Linux-Specific

**File Paths:**
- Use forward slashes
- Respect case-sensitive filesystem
- Handle spaces in paths with proper quoting

**LibreOffice Integration:**
- Check if LibreOffice is installed: `which libreoffice`
- Use headless mode for conversions
- Handle different install locations (apt, snap, flatpak)

**Keyboard Shortcuts:**
- Test Ctrl vs Super key behavior
- Ensure shortcuts don't conflict with desktop environment

**Window Management:**
- Test with different window managers (GNOME, KDE, i3)
- Fullscreen behavior may vary

**File Dialogs:**
- May use GTK or Qt depending on desktop environment
- File type filters work correctly

### 11.2 Windows-Specific

**File Paths:**
- Use path.win32.normalize for Windows paths
- Handle backslashes correctly
- Support UNC paths (\\server\share)

**PowerPoint Integration:**
- Consider using PowerPoint COM API if available
- Fall back to file parsing if not

**Keyboard Shortcuts:**
- Ensure shortcuts don't conflict with Windows system shortcuts
- Test with Windows key combinations

**File Dialogs:**
- Native Windows file picker
- Support common locations (Desktop, Documents)

**Installer:**
- Use Squirrel.Windows for Windows installer
- Handle installation directory permissions
- Create Start Menu shortcuts

### 11.3 Cross-Platform Best Practices

**Path Handling:**
```typescript
import path from 'node:path';

// Always use path module for cross-platform compatibility
const slidePath = path.join(presentationDir, 'slides', `slide${num}.png`);
```

**Line Endings:**
- Use `\n` in code
- Let git handle line ending conversion (`.gitattributes`)

**Testing:**
- Test on both Linux and Windows before releases
- Use virtual machines or CI/CD for cross-platform testing

**Dependencies:**
- Prefer pure JavaScript libraries over native modules
- If using native modules, ensure they have prebuilt binaries for both platforms

---

## 12. Code Examples

### 12.1 Main Process Entry Point

```typescript
// src/main/index.ts

import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { WindowManager } from './windowManager';
import { PresentationManager } from './presentationManager';
import { registerIPCHandlers } from './ipcHandlers';

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  let windowManager: WindowManager;
  let presentationManager: PresentationManager;

  app.on('ready', async () => {
    // Initialize services
    presentationManager = new PresentationManager();
    windowManager = new WindowManager();

    // Register IPC handlers
    registerIPCHandlers(presentationManager, windowManager);

    // Create initial window
    windowManager.createSetupWindow();
  });

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    app.quit();
  });

  // Handle second instance
  app.on('second-instance', () => {
    const setupWindow = windowManager.getSetupWindow();
    if (setupWindow) {
      if (setupWindow.isMinimized()) setupWindow.restore();
      setupWindow.focus();
    }
  });
}
```

### 12.2 Window Manager Example

```typescript
// src/main/windowManager.ts

import { BrowserWindow } from 'electron';
import path from 'node:path';

export class WindowManager {
  private setupWindow: BrowserWindow | null = null;
  private presentWindow: BrowserWindow | null = null;

  createSetupWindow(): BrowserWindow {
    this.setupWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 600,
      minHeight: 400,
      title: 'PowerPoint Stacker - Setup',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    // Load renderer
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.setupWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.setupWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }

    return this.setupWindow;
  }

  createPresentationWindow(): BrowserWindow {
    this.presentWindow = new BrowserWindow({
      fullscreen: true,
      title: 'PowerPoint Stacker - Presentation',
      backgroundColor: '#000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      frame: false
    });

    // Load presentation view
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.presentWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/present`);
    } else {
      this.presentWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/present.html`)
      );
    }

    return this.presentWindow;
  }

  switchToSetupMode(): void {
    if (this.presentWindow) {
      this.presentWindow.hide();
    }
    if (this.setupWindow) {
      this.setupWindow.show();
    }
  }

  switchToPresentationMode(): void {
    if (!this.presentWindow) {
      this.createPresentationWindow();
    }
    this.presentWindow!.show();
    this.presentWindow!.setFullScreen(true);
    if (this.setupWindow) {
      this.setupWindow.hide();
    }
  }

  getSetupWindow(): BrowserWindow | null {
    return this.setupWindow;
  }

  getPresentationWindow(): BrowserWindow | null {
    return this.presentWindow;
  }
}
```

### 12.3 IPC Handler Registration Example

```typescript
// src/main/ipcHandlers.ts

import { ipcMain, dialog } from 'electron';
import type { WindowManager } from './windowManager';
import type { PresentationManager } from './presentationManager';
import type { IPCResponse } from '../common/types';

export function registerIPCHandlers(
  presentationManager: PresentationManager,
  windowManager: WindowManager
): void {
  // File dialog
  ipcMain.handle('dialog:openFiles', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Presentation Files',
        filters: [
          { name: 'Presentations', extensions: ['pptx', 'odp'] },
          { name: 'PowerPoint', extensions: ['pptx'] },
          { name: 'OpenDocument', extensions: ['odp'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      return {
        success: true,
        data: {
          filePaths: result.filePaths,
          canceled: result.canceled
        }
      } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Add presentations
  ipcMain.handle('presentation:add', async (event, request) => {
    try {
      const result = await presentationManager.addPresentations(request.filePaths);
      return { success: true, data: result } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Start presentation
  ipcMain.handle('present:start', async (event, request) => {
    try {
      const slideData = presentationManager.startPresentation(
        request.startPresentationId,
        request.startSlideNumber
      );
      windowManager.switchToPresentationMode();
      return { success: true, data: slideData } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Navigate
  ipcMain.handle('present:navigate', async (event, request) => {
    try {
      const result = presentationManager.navigate(request.direction);

      if (result === null) {
        // End of presentations - send event
        const presentWindow = windowManager.getPresentationWindow();
        if (presentWindow) {
          presentWindow.webContents.send('presentation:ended', {
            totalPresentationsShown: presentationManager.getQueue().order.length,
            totalSlidesShown: calculateTotalSlides(presentationManager.getQueue())
          });
        }
        return { success: true, data: null } as IPCResponse;
      }

      return { success: true, data: result } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // ... other handlers
}

function formatError(error: unknown): IPCResponse {
  // Format error for IPC response
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: String(error)
    }
  };
}

function calculateTotalSlides(queue: PresentationQueue): number {
  return queue.order.reduce((total, id) => {
    return total + queue.presentations[id].slideCount;
  }, 0);
}
```

### 12.4 React Component Example

```typescript
// src/renderer/components/SetupView/SetupView.tsx

import React, { useState, useEffect } from 'react';
import type { PresentationFile, PresentationQueue, UUID } from '../../../common/types';
import { FileList } from './FileList';
import { AddFilesButton } from './AddFilesButton';
import { StartButton } from './StartButton';

export function SetupView() {
  const [presentations, setPresentations] = useState<PresentationFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial queue
    loadQueue();

    // Listen for queue updates
    window.electronAPI.onQueueUpdated((queue: PresentationQueue) => {
      const orderedPresentations = queue.order.map(id => queue.presentations[id]);
      setPresentations(orderedPresentations);
    });
  }, []);

  const loadQueue = async () => {
    const response = await window.electronAPI.getQueue();
    if (response.success && response.data) {
      const orderedPresentations = response.data.order.map(
        id => response.data!.presentations[id]
      );
      setPresentations(orderedPresentations);
    }
  };

  const handleAddFiles = async () => {
    const dialogResult = await window.electronAPI.openFileDialog();
    if (dialogResult.success && !dialogResult.data?.canceled) {
      if (dialogResult.data!.filePaths.length > 0) {
        setIsLoading(true);
        const addResult = await window.electronAPI.addPresentations({
          filePaths: dialogResult.data!.filePaths
        });
        setIsLoading(false);

        if (addResult.success && addResult.data!.failed.length > 0) {
          // Show error notification for failed files
          alert(`Failed to load ${addResult.data!.failed.length} file(s):\n` +
            addResult.data!.failed.map(f => `${f.filePath}: ${f.error}`).join('\n'));
        }
      }
    }
  };

  const handleRemove = async (id: UUID) => {
    await window.electronAPI.removePresentation({ presentationId: id });
  };

  const handleReorder = async (newOrder: UUID[]) => {
    await window.electronAPI.reorderPresentations({ order: newOrder });
  };

  const handleStart = async () => {
    if (presentations.length === 0) return;

    const response = await window.electronAPI.startPresentation({});
    if (!response.success) {
      alert(`Failed to start presentation: ${response.error?.message}`);
    }
  };

  return (
    <div className="setup-view">
      <header>
        <h1>PowerPoint Stacker - Setup</h1>
      </header>

      <AddFilesButton onClick={handleAddFiles} disabled={isLoading} />

      <FileList
        presentations={presentations}
        onRemove={handleRemove}
        onReorder={handleReorder}
      />

      <footer>
        <div className="stats">
          Total: {presentations.length} presentations, {' '}
          {presentations.reduce((sum, p) => sum + p.slideCount, 0)} slides
        </div>
        <StartButton
          onClick={handleStart}
          disabled={presentations.length === 0}
        />
      </footer>
    </div>
  );
}
```

---

## Appendix A: Development Workflow

### For UI Developer

1. Start with reading this SPEC.md completely
2. Set up the renderer process structure
3. Implement UI components based on section 6.2
4. Use mock data initially (no IPC calls)
5. Integrate IPC calls once Service Developer completes preload script
6. Test UI flows independently
7. Coordinate with Service Developer for integration testing

### For Service Developer

1. Start with reading this SPEC.md completely
2. Set up main process structure
3. Implement core services (PresentationManager, PresentationParser)
4. Implement IPC handlers based on section 4
5. Create preload script with type-safe API
6. Test services with manual IPC calls
7. Coordinate with UI Developer for integration testing

### Integration Points

The following are critical integration points where both developers must coordinate:

1. **IPC Channel Contracts** (Section 4): Exact channel names and payload types
2. **Type Definitions** (Section 3): Shared TypeScript interfaces
3. **Error Handling** (Section 10): Error codes and messages
4. **Window Management** (Section 9): Window lifecycle events
5. **Keyboard Shortcuts** (Section 8.6): Event handling coordination

---

## Appendix B: Future Enhancements

Features not in scope for initial version but documented for future consideration:

1. **Presentation Thumbnails**: Show thumbnail preview of each presentation
2. **Slide Thumbnails**: Grid view of all slides
3. **Speaker Notes**: Display speaker notes on second monitor
4. **Presentation Timer**: Track time spent on each slide/presentation
5. **Annotation Tools**: Draw on slides during presentation
6. **Remote Control**: Control presentation from mobile device
7. **Recording**: Record presentation with audio
8. **PDF Export**: Export entire sequence as single PDF
9. **Presentation Templates**: Save common presentation sequences
10. **Cloud Sync**: Sync presentation queues across devices

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Main Process** | Node.js process running Electron's main logic, has full system access |
| **Renderer Process** | Chromium process running UI, sandboxed for security |
| **Preload Script** | Privileged script bridging main and renderer securely |
| **IPC** | Inter-Process Communication, messaging between main and renderer |
| **Context Isolation** | Security feature preventing renderer from accessing Node.js directly |
| **UUID** | Universally Unique Identifier, string used as unique ID |
| **PPTX** | PowerPoint file format (Office Open XML) |
| **ODP** | OpenDocument Presentation format (LibreOffice/OpenOffice) |
| **Presentation Queue** | Ordered list of presentations to be shown |
| **Slide Navigation** | Moving between slides within or across presentations |

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-04 | Initial specification | Spec Designer Agent |

---

## Approval and Sign-off

This specification document serves as the contract between the UI Developer and Service Developer agents. Both agents must adhere to this specification to ensure seamless integration.

**For UI Developer:**
- Implement all UI components as specified in Section 6
- Use exact IPC channel names from Section 4
- Handle all error cases from Section 10
- Follow type definitions from Section 3

**For Service Developer:**
- Implement all IPC handlers as specified in Section 4
- Maintain state as defined in Section 3
- Handle all error cases from Section 10
- Expose preload API as defined in Section 7

**Questions or Clarifications:**
If either developer encounters ambiguity or needs clarification, escalate to the Spec Designer agent for resolution before proceeding with implementation.

---

**End of Specification Document**
