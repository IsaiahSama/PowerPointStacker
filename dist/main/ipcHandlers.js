"use strict";
/**
 * PowerPoint Stacker - IPC Handlers
 * Registers all IPC channel handlers for communication between main and renderer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalSlides = exports.registerIPCHandlers = void 0;
const electron_1 = require("electron");
const types_1 = require("../common/types");
/**
 * Register all IPC handlers
 */
function registerIPCHandlers(presentationManager, windowManager) {
    // File dialog
    electron_1.ipcMain.handle('dialog:openFiles', async () => {
        try {
            const setupWindow = windowManager.getSetupWindow();
            const result = await electron_1.dialog.showOpenDialog(setupWindow || undefined, {
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
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Add presentations
    electron_1.ipcMain.handle('presentation:add', async (_event, request) => {
        try {
            const result = await presentationManager.addPresentations(request.filePaths);
            // Broadcast queue update
            presentationManager.broadcastQueueUpdate();
            return { success: true, data: result };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Remove presentation
    electron_1.ipcMain.handle('presentation:remove', async (_event, request) => {
        try {
            presentationManager.removePresentation(request.presentationId);
            // Broadcast queue update
            presentationManager.broadcastQueueUpdate();
            return { success: true };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Reorder presentations
    electron_1.ipcMain.handle('presentation:reorder', async (_event, request) => {
        try {
            presentationManager.reorderPresentations(request.order);
            // Broadcast queue update
            presentationManager.broadcastQueueUpdate();
            return { success: true };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Get queue
    electron_1.ipcMain.handle('presentation:getQueue', async () => {
        try {
            const queue = presentationManager.getQueue();
            return { success: true, data: queue };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Clear queue
    electron_1.ipcMain.handle('presentation:clear', async () => {
        try {
            presentationManager.clearQueue();
            // Broadcast queue update
            presentationManager.broadcastQueueUpdate();
            return { success: true };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Start presentation
    electron_1.ipcMain.handle('present:start', async (_event, request) => {
        try {
            const slideData = await presentationManager.startPresentation(request.startPresentationId, request.startSlideNumber);
            // Switch to presentation mode
            windowManager.switchToPresentationMode();
            return { success: true, data: slideData };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Stop presentation
    electron_1.ipcMain.handle('present:stop', async () => {
        try {
            presentationManager.stopPresentation();
            // Switch to setup mode
            windowManager.switchToSetupMode();
            return { success: true };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Navigate
    electron_1.ipcMain.handle('present:navigate', async (_event, request) => {
        try {
            const result = await presentationManager.navigate(request.direction);
            if (result === null) {
                // End of presentations - send event to presentation window
                const presentWindow = windowManager.getPresentationWindow();
                if (presentWindow) {
                    const endedEvent = presentationManager.getPresentationEndedEvent();
                    presentWindow.webContents.send('presentation:ended', endedEvent);
                }
                return { success: true, data: null };
            }
            // Send slide changed event
            const presentWindow = windowManager.getPresentationWindow();
            if (presentWindow) {
                presentWindow.webContents.send('slide:changed', result);
            }
            return { success: true, data: result };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Get current slide
    electron_1.ipcMain.handle('present:getCurrentSlide', async () => {
        try {
            const slideData = await presentationManager.getCurrentSlide();
            return { success: true, data: slideData };
        }
        catch (error) {
            return formatError(error);
        }
    });
    // Quit app
    electron_1.ipcMain.on('app:quit', () => {
        electron_1.app.quit();
    });
}
exports.registerIPCHandlers = registerIPCHandlers;
/**
 * Format error for IPC response
 */
function formatError(error) {
    if (error instanceof types_1.AppError) {
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
            code: types_1.ErrorCode.UNKNOWN_ERROR,
            message: error instanceof Error ? error.message : String(error)
        }
    };
}
/**
 * Calculate total slides across all presentations
 */
function calculateTotalSlides(presentationManager) {
    return presentationManager.getTotalSlideCount();
}
exports.calculateTotalSlides = calculateTotalSlides;
//# sourceMappingURL=ipcHandlers.js.map