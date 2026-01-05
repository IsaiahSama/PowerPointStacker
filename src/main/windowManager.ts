/**
 * PowerPoint Stacker - Window Manager
 * Manages application windows (setup and presentation)
 */

import { BrowserWindow, screen, dialog } from 'electron';
import path from 'node:path';
import { getConfig } from './config';

// Vite environment variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export class WindowManager {
  private setupWindow: BrowserWindow | null = null;
  private presentWindow: BrowserWindow | null = null;
  private config = getConfig();
  private isExitingApp = false; // Flag to track intentional app exit vs mode switching

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

    // Intercept window close to show confirmation dialog
    this.setupWindow.on('close', async (event) => {

      if (!this.setupWindow) {
        return;
      }

      // Only show confirmation if user is trying to exit (not during mode switching)
      if (this.isExitingApp) {
        // Already confirmed exit, allow close to proceed
        return;
      }

      // Prevent immediate close to show confirmation
      event.preventDefault();

      // Show confirmation dialog
      const result = await dialog.showMessageBox(this.setupWindow, {
        type: 'question',
        buttons: ['Cancel', 'Exit'],
        defaultId: 0,
        cancelId: 0,
        title: 'Exit PowerPoint Stacker',
        message: 'Are you sure you want to exit?',
        detail: 'Any unsaved presentation queue will be lost.'
      });

      // If user confirms exit, close the window without confirmation
      if (result.response === 1) {
        // Set flag to allow close without confirmation
        this.isExitingApp = true;
        this.setupWindow.close();
      }
    });

    // Handle window closed (after close event completes)
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
   * Show setup window, destroy presentation window
   */
  switchToSetupMode(): void {

    // Destroy presentation window to free resources
    if (this.presentWindow && !this.presentWindow.isDestroyed()) {
      // Remove all listeners before destroying to avoid triggering close events
      this.presentWindow.removeAllListeners();
      this.presentWindow.destroy();
      this.presentWindow = null;
    }

    // Always destroy and recreate setup window to ensure it shows properly
    // Hidden windows don't always reappear correctly when show() is called
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      // Temporarily disable exit flag to prevent confirmation dialog
      const wasExiting = this.isExitingApp;
      this.isExitingApp = true;
      this.setupWindow.removeAllListeners();
      this.setupWindow.destroy();
      this.isExitingApp = wasExiting;
      this.setupWindow = null;
    }

    // Create fresh setup window
    this.createSetupWindow();

    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      // Force show and focus
      this.setupWindow.show();
      this.setupWindow.focus();
      this.setupWindow.moveTop();
    } else {
      console.error('Failed to create setup window');
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

    // Hide setup window but keep it in memory so it doesn't trigger window-all-closed
    if (this.setupWindow) {
      this.setupWindow.hide();
    }
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    // Set exit flag to allow close without confirmation
    this.isExitingApp = true;

    if (this.presentWindow && !this.presentWindow.isDestroyed()) {
      this.presentWindow.close();
      this.presentWindow = null;
    }
    if (this.setupWindow && !this.setupWindow.isDestroyed()) {
      this.setupWindow.close();
      this.setupWindow = null;
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
