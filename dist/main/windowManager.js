"use strict";
/**
 * PowerPoint Stacker - Window Manager
 * Manages application windows (setup and presentation)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("./config");
class WindowManager {
    setupWindow = null;
    presentWindow = null;
    config = (0, config_1.getConfig)();
    /**
     * Create the setup window (initial window for file management)
     */
    createSetupWindow() {
        const { width, height, minWidth, minHeight } = this.config.setupWindow;
        this.setupWindow = new electron_1.BrowserWindow({
            width,
            height,
            minWidth,
            minHeight,
            title: 'PowerPoint Stacker - Setup',
            webPreferences: {
                preload: node_path_1.default.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            },
            show: true
        });
        // Load renderer
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            this.setupWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        }
        else {
            this.setupWindow.loadFile(node_path_1.default.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
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
    createPresentationWindow() {
        const { backgroundColor } = this.config.presentWindow;
        const primaryDisplay = electron_1.screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.bounds;
        this.presentWindow = new electron_1.BrowserWindow({
            width,
            height,
            fullscreen: true,
            title: 'PowerPoint Stacker - Presentation',
            backgroundColor,
            webPreferences: {
                preload: node_path_1.default.join(__dirname, 'preload.js'),
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
        }
        else {
            this.presentWindow.loadFile(node_path_1.default.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/present.html`));
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
    switchToSetupMode() {
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
    switchToPresentationMode() {
        if (!this.presentWindow) {
            this.createPresentationWindow();
        }
        // Wait for window to be ready before showing
        if (this.presentWindow) {
            this.presentWindow.once('ready-to-show', () => {
                this.presentWindow.show();
                this.presentWindow.setFullScreen(true);
                this.presentWindow.focus();
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
    closeAllWindows() {
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
    getSetupWindow() {
        return this.setupWindow;
    }
    /**
     * Get reference to presentation window
     */
    getPresentationWindow() {
        return this.presentWindow;
    }
    /**
     * Check if setup window exists and is not destroyed
     */
    hasSetupWindow() {
        return this.setupWindow !== null && !this.setupWindow.isDestroyed();
    }
    /**
     * Check if presentation window exists and is not destroyed
     */
    hasPresentationWindow() {
        return this.presentWindow !== null && !this.presentWindow.isDestroyed();
    }
    /**
     * Toggle fullscreen mode for presentation window
     */
    togglePresentationFullscreen() {
        if (this.presentWindow) {
            const isFullscreen = this.presentWindow.isFullScreen();
            this.presentWindow.setFullScreen(!isFullscreen);
        }
    }
    /**
     * Focus setup window
     */
    focusSetupWindow() {
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
    focusPresentationWindow() {
        if (this.presentWindow && !this.presentWindow.isDestroyed()) {
            if (this.presentWindow.isMinimized()) {
                this.presentWindow.restore();
            }
            this.presentWindow.focus();
        }
    }
}
exports.WindowManager = WindowManager;
//# sourceMappingURL=windowManager.js.map