/**
 * PowerPoint Stacker - Main Process Entry Point
 */

import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { WindowManager } from './windowManager';
import { PresentationManager } from './presentationManager';
import { registerIPCHandlers } from './ipcHandlers';
import { registerKeyboardShortcuts } from './keyboardShortcuts';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  let windowManager: WindowManager;
  let presentationManager: PresentationManager;

  /**
   * Initialize application
   */
  app.on('ready', async () => {
    // Initialize services
    presentationManager = new PresentationManager();
    windowManager = new WindowManager();

    // Register IPC handlers
    registerIPCHandlers(presentationManager, windowManager);

    // Create initial setup window
    windowManager.createSetupWindow();

    // Register keyboard shortcuts when presentation window is created
    // This will be called when switching to presentation mode
    const originalSwitchToPresentationMode = windowManager.switchToPresentationMode.bind(windowManager);
    windowManager.switchToPresentationMode = function() {
      originalSwitchToPresentationMode();
      // Give the window time to be created
      setTimeout(() => {
        registerKeyboardShortcuts(presentationManager, windowManager);
      }, 100);
    };
  });

  /**
   * Quit when all windows are closed (as per requirements)
   */
  app.on('window-all-closed', () => {
    app.quit();
  });

  /**
   * Handle second instance - focus existing window
   */
  app.on('second-instance', () => {
    const setupWindow = windowManager.getSetupWindow();
    if (setupWindow) {
      if (setupWindow.isMinimized()) {
        setupWindow.restore();
      }
      setupWindow.focus();
    }
  });

  /**
   * Handle app activation (macOS)
   */
  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createSetupWindow();
    }
  });
}
