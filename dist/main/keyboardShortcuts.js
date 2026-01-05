"use strict";
/**
 * PowerPoint Stacker - Keyboard Shortcuts
 * Handles keyboard shortcuts for presentation navigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregisterKeyboardShortcuts = exports.registerKeyboardShortcuts = void 0;
const types_1 = require("../common/types");
/**
 * Register keyboard shortcuts for presentation window
 */
function registerKeyboardShortcuts(presentationManager, windowManager) {
    const presentWindow = windowManager.getPresentationWindow();
    if (!presentWindow) {
        return;
    }
    presentWindow.webContents.on('before-input-event', async (event, input) => {
        if (input.type !== 'keyDown') {
            return;
        }
        await handleKeyboardInput(input, event, presentationManager, windowManager);
    });
}
exports.registerKeyboardShortcuts = registerKeyboardShortcuts;
/**
 * Handle keyboard input
 */
async function handleKeyboardInput(input, event, presentationManager, windowManager) {
    const presentWindow = windowManager.getPresentationWindow();
    if (!presentWindow) {
        return;
    }
    try {
        switch (input.key) {
            case 'ArrowRight':
            case 'Right':
                await handleNavigation(types_1.NavigationDirection.NEXT, presentationManager, presentWindow);
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'Left':
                await handleNavigation(types_1.NavigationDirection.PREVIOUS, presentationManager, presentWindow);
                event.preventDefault();
                break;
            case 'PageDown':
                if (input.control || input.meta) {
                    await handleNavigation(types_1.NavigationDirection.NEXT_PRESENTATION, presentationManager, presentWindow);
                    event.preventDefault();
                }
                break;
            case 'PageUp':
                if (input.control || input.meta) {
                    await handleNavigation(types_1.NavigationDirection.PREVIOUS_PRESENTATION, presentationManager, presentWindow);
                    event.preventDefault();
                }
                break;
            case 'Home':
                await handleNavigation(types_1.NavigationDirection.FIRST_SLIDE, presentationManager, presentWindow);
                event.preventDefault();
                break;
            case 'End':
                await handleNavigation(types_1.NavigationDirection.LAST_SLIDE, presentationManager, presentWindow);
                event.preventDefault();
                break;
            case 'Escape':
            case 'Esc':
                presentationManager.stopPresentation();
                windowManager.switchToSetupMode();
                event.preventDefault();
                break;
            default:
                // No action for other keys
                break;
        }
    }
    catch (error) {
        console.error('Error handling keyboard input:', error);
    }
}
/**
 * Handle navigation and send updates to renderer
 */
async function handleNavigation(direction, presentationManager, presentWindow) {
    try {
        const result = await presentationManager.navigate(direction);
        if (result === null) {
            // End of presentations reached
            const endedEvent = presentationManager.getPresentationEndedEvent();
            presentWindow.webContents.send('presentation:ended', endedEvent);
        }
        else {
            // Send updated slide data
            presentWindow.webContents.send('slide:changed', result);
        }
    }
    catch (error) {
        console.error('Navigation error:', error);
    }
}
/**
 * Unregister keyboard shortcuts
 */
function unregisterKeyboardShortcuts(windowManager) {
    const presentWindow = windowManager.getPresentationWindow();
    if (presentWindow) {
        presentWindow.webContents.removeAllListeners('before-input-event');
    }
}
exports.unregisterKeyboardShortcuts = unregisterKeyboardShortcuts;
//# sourceMappingURL=keyboardShortcuts.js.map