"use strict";
/**
 * PowerPoint Stacker - Main Process Entry Point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_squirrel_startup_1 = __importDefault(require("electron-squirrel-startup"));
const windowManager_1 = require("./windowManager");
const presentationManager_1 = require("./presentationManager");
const ipcHandlers_1 = require("./ipcHandlers");
const keyboardShortcuts_1 = require("./keyboardShortcuts");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electron_squirrel_startup_1.default) {
    electron_1.app.quit();
}
// Prevent multiple instances
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    let windowManager;
    let presentationManager;
    /**
     * Initialize application
     */
    electron_1.app.on('ready', async () => {
        // Initialize services
        presentationManager = new presentationManager_1.PresentationManager();
        windowManager = new windowManager_1.WindowManager();
        // Register IPC handlers
        (0, ipcHandlers_1.registerIPCHandlers)(presentationManager, windowManager);
        // Create initial setup window
        windowManager.createSetupWindow();
        // Register keyboard shortcuts when presentation window is created
        // This will be called when switching to presentation mode
        const originalSwitchToPresentationMode = windowManager.switchToPresentationMode.bind(windowManager);
        windowManager.switchToPresentationMode = function () {
            originalSwitchToPresentationMode();
            // Give the window time to be created
            setTimeout(() => {
                (0, keyboardShortcuts_1.registerKeyboardShortcuts)(presentationManager, windowManager);
            }, 100);
        };
    });
    /**
     * Quit when all windows are closed (as per requirements)
     */
    electron_1.app.on('window-all-closed', () => {
        electron_1.app.quit();
    });
    /**
     * Handle second instance - focus existing window
     */
    electron_1.app.on('second-instance', () => {
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
    electron_1.app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            windowManager.createSetupWindow();
        }
    });
}
//# sourceMappingURL=index.js.map