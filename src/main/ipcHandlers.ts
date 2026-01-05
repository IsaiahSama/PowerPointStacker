/**
 * PowerPoint Stacker - IPC Handlers
 * Registers all IPC channel handlers for communication between main and renderer
 */

import { ipcMain, dialog, app } from 'electron';
import type { WindowManager } from './windowManager';
import type { PresentationManager } from './presentationManager';
import type {
  IPCResponse,
  AddPresentationsRequest,
  RemovePresentationRequest,
  ReorderPresentationsRequest,
  StartPresentationRequest,
  NavigateRequest
} from '../common/types';
import { ErrorCode, AppError } from '../common/types';

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(
  presentationManager: PresentationManager,
  windowManager: WindowManager
): void {
  // File dialog
  ipcMain.handle('dialog:openFiles', async () => {
    try {
      const setupWindow = windowManager.getSetupWindow();
      const result = await dialog.showOpenDialog(setupWindow || undefined as any, {
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
  ipcMain.handle('presentation:add', async (_event, request: AddPresentationsRequest) => {
    try {
      const result = await presentationManager.addPresentations(request.filePaths);

      // Broadcast queue update
      presentationManager.broadcastQueueUpdate();

      return { success: true, data: result } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Remove presentation
  ipcMain.handle('presentation:remove', async (_event, request: RemovePresentationRequest) => {
    try {
      presentationManager.removePresentation(request.presentationId);

      // Broadcast queue update
      presentationManager.broadcastQueueUpdate();

      return { success: true } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Reorder presentations
  ipcMain.handle('presentation:reorder', async (_event, request: ReorderPresentationsRequest) => {
    try {
      presentationManager.reorderPresentations(request.order);

      // Broadcast queue update
      presentationManager.broadcastQueueUpdate();

      return { success: true } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Get queue
  ipcMain.handle('presentation:getQueue', async () => {
    try {
      const queue = presentationManager.getQueue();
      return { success: true, data: queue } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Clear queue
  ipcMain.handle('presentation:clear', async () => {
    try {
      presentationManager.clearQueue();

      // Broadcast queue update
      presentationManager.broadcastQueueUpdate();

      return { success: true } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Pre-render all slides
  ipcMain.handle('present:preRender', async () => {
    try {
      await presentationManager.preRenderAllSlides();
      return { success: true } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Start presentation
  ipcMain.handle('present:start', async (_event, request: StartPresentationRequest) => {
    try {
      const slideData = await presentationManager.startPresentation(
        request.startPresentationId,
        request.startSlideNumber
      );

      // Switch to presentation mode
      windowManager.switchToPresentationMode();

      return { success: true, data: slideData } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Stop presentation
  ipcMain.handle('present:stop', async () => {
    try {
      presentationManager.stopPresentation();

      // Switch to setup mode
      windowManager.switchToSetupMode();

      return { success: true } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Navigate
  ipcMain.handle('present:navigate', async (_event, request: NavigateRequest) => {
    try {
      const result = await presentationManager.navigate(request.direction);

      if (result === null) {
        // End of presentations - send event to presentation window
        const presentWindow = windowManager.getPresentationWindow();
        if (presentWindow) {
          const endedEvent = presentationManager.getPresentationEndedEvent();
          presentWindow.webContents.send('presentation:ended', endedEvent);
        }
        return { success: true, data: null } as IPCResponse;
      }

      // Send slide changed event
      const presentWindow = windowManager.getPresentationWindow();
      if (presentWindow) {
        presentWindow.webContents.send('slide:changed', result);
      }

      return { success: true, data: result } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Get current slide
  ipcMain.handle('present:getCurrentSlide', async () => {
    try {
      const slideData = await presentationManager.getCurrentSlide();
      return { success: true, data: slideData } as IPCResponse;
    } catch (error) {
      return formatError(error);
    }
  });

  // Quit app
  ipcMain.on('app:quit', () => {
    app.quit();
  });
}

/**
 * Format error for IPC response
 */
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
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

/**
 * Calculate total slides across all presentations
 */
export function calculateTotalSlides(presentationManager: PresentationManager): number {
  return presentationManager.getTotalSlideCount();
}
