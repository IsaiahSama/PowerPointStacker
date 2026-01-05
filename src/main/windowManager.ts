/**
 * PowerPoint Stacker - Window Manager
 * Manages application windows (setup and presentation)
 */

import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { getConfig } from './config';

// Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export class WindowManager {
  private setupWindow: BrowserWindow | null = null;
  private presentWindow: BrowserWindow | null = null;
  private config = getConfig();

  /**
   * Create the setup window (initial window for file management)
   */
  createSetupWindow(): BrowserWindow {
    const { width, height, minWidth, minHeight } = this.config.setupWindow;

    this.setupWindow = new BrowserWindow({
      width,
      height,
      minWidth,
      minHeight,
      title: 'PowerPoint Stacker - Setup',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      show: true
    });

    // Load renderer
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.setupWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.setupWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }

    // Open DevTools in development
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.setupWindow.webContents.openDevTools();
    }

    // Handle window close
    this.setupWindow.on('closed', () => {
      this.setupWindow = null;
    });

    return this.setupWindow;
  }

  /**
   * Create the presentation window (fullscreen for presenting)
   */
  createPresentationWindow(): BrowserWindow {
    const { backgroundColor } = this.config.presentWindow;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;

    this.presentWindow = new BrowserWindow({
      width,
      height,
      fullscreen: true,
      title: 'PowerPoint Stacker - Presentation',
      backgroundColor,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      },
      frame: false,
      show: false
    });

    // Load presentation view
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.presentWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/present`);
    } else {
      this.presentWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/present.html`)
      );
    }

    // Handle window close
    this.presentWindow.on('closed', () => {
      this.presentWindow = null;
    });

    return this.presentWindow;
  }

  /**
   * Show setup window, hide presentation window
   */
  switchToSetupMode(): void {
    if (this.presentWindow) {
      this.presentWindow.hide();
      this.presentWindow.setFullScreen(false);
    }
    if (this.setupWindow) {
      this.setupWindow.show();
      this.setupWindow.focus();
    }
  }

  /**
   * Show presentation window fullscreen, hide setup window
   */
  switchToPresentationMode(): void {
    if (!this.presentWindow) {
      this.createPresentationWindow();
    }

    // Wait for window to be ready before showing
    if (this.presentWindow) {
      this.presentWindow.once('ready-to-show', () => {
        this.presentWindow!.show();
        this.presentWindow!.setFullScreen(true);
        this.presentWindow!.focus();
      });

      // If already ready, show immediately
      if (this.presentWindow.isVisible() || this.presentWindow.webContents.isLoading() === false) {
        this.presentWindow.show();
        this.presentWindow.setFullScreen(true);
        this.presentWindow.focus();
      }
    }

    if (this.setupWindow) {
      this.setupWindow.hide();
    }
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    if (this.setupWindow) {
      this.setupWindow.close();
      this.setupWindow = null;
    }
    if (this.presentWindow) {
      this.presentWindow.close();
      this.presentWindow = null;
    }
  }

  /**
   * Get reference to setup window
   */
  getSetupWindow(): BrowserWindow | null {
    return this.setupWindow;
  }

  /**
   * Get reference to presentation window
   */
  getPresentationWindow(): BrowserWindow | null {
    return this.presentWindow;
  }

  /**
   * Check if setup window exists and is not destroyed
   */
  hasSetupWindow(): boolean {
    return this.setupWindow !== null && !this.setupWindow.isDestroyed();
  }

  /**
   * Check if presentation window exists and is not destroyed
   */
  hasPresentationWindow(): boolean {
    return this.presentWindow !== null && !this.presentWindow.isDestroyed();
  }

  /**
   * Toggle fullscreen mode for presentation window
   */
  togglePresentationFullscreen(): void {
    if (this.presentWindow) {
      const isFullscreen = this.presentWindow.isFullScreen();
      this.presentWindow.setFullScreen(!isFullscreen);
    }
  }

  /**
   * Focus setup window
   */
  focusSetupWindow(): void {
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      if (this.setupWindow.isMinimized()) {
        this.setupWindow.restore();
      }
      this.setupWindow.focus();
    }
  }

  /**
   * Focus presentation window
   */
  focusPresentationWindow(): void {
    if (this.presentWindow && !this.presentWindow.isDestroyed()) {
      if (this.presentWindow.isMinimized()) {
        this.presentWindow.restore();
      }
      this.presentWindow.focus();
    }
  }
}
