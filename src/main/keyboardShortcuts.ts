/**
 * PowerPoint Stacker - Keyboard Shortcuts
 * Handles keyboard shortcuts for presentation navigation
 */

import type { Input } from 'electron';
import type { WindowManager } from './windowManager';
import type { PresentationManager } from './presentationManager';
import { NavigationDirection } from '../common/types';

// Throttle state to prevent rapid successive navigation
let lastNavigationTime = 0;
const NAVIGATION_THROTTLE_MS = 250; // 250ms delay between navigations

/**
 * Register keyboard shortcuts for presentation window
 */
export function registerKeyboardShortcuts(
  presentationManager: PresentationManager,
  windowManager: WindowManager
): void {
  const presentWindow = windowManager.getPresentationWindow();

  if (!presentWindow) {
    return;
  }

  // Reset throttle when registering
  lastNavigationTime = 0;

  presentWindow.webContents.on('before-input-event', async (event, input) => {
    if (input.type !== 'keyDown') {
      return;
    }

    await handleKeyboardInput(input, event, presentationManager, windowManager);
  });
}

/**
 * Handle keyboard input
 */
async function handleKeyboardInput(
  input: Input,
  event: Electron.Event,
  presentationManager: PresentationManager,
  windowManager: WindowManager
): Promise<void> {
  const presentWindow = windowManager.getPresentationWindow();

  if (!presentWindow) {
    return;
  }

  try {
    switch (input.key) {
      case 'ArrowRight':
      case 'Right':
        await handleNavigation(NavigationDirection.NEXT, presentationManager, presentWindow);
        event.preventDefault();
        break;

      case 'ArrowLeft':
      case 'Left':
        await handleNavigation(NavigationDirection.PREVIOUS, presentationManager, presentWindow);
        event.preventDefault();
        break;

      case 'PageDown':
        if (input.control || input.meta) {
          await handleNavigation(NavigationDirection.NEXT_PRESENTATION, presentationManager, presentWindow);
          event.preventDefault();
        }
        break;

      case 'PageUp':
        if (input.control || input.meta) {
          await handleNavigation(NavigationDirection.PREVIOUS_PRESENTATION, presentationManager, presentWindow);
          event.preventDefault();
        }
        break;

      case 'Home':
        await handleNavigation(NavigationDirection.FIRST_SLIDE, presentationManager, presentWindow);
        event.preventDefault();
        break;

      case 'End':
        await handleNavigation(NavigationDirection.LAST_SLIDE, presentationManager, presentWindow);
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
  } catch (error) {
    console.error('Error handling keyboard input:', error);
  }
}

/**
 * Handle navigation and send updates to renderer
 * Includes throttling to prevent rapid successive navigation
 */
async function handleNavigation(
  direction: NavigationDirection,
  presentationManager: PresentationManager,
  presentWindow: Electron.BrowserWindow
): Promise<void> {
  // Throttle navigation to prevent rapid successive events
  const now = Date.now();
  if (now - lastNavigationTime < NAVIGATION_THROTTLE_MS) {
    console.log(`Navigation throttled (${now - lastNavigationTime}ms since last navigation)`);
    return;
  }

  lastNavigationTime = now;

  try {
    const result = await presentationManager.navigate(direction);

    if (result === null) {
      // End of presentations reached
      const endedEvent = presentationManager.getPresentationEndedEvent();
      presentWindow.webContents.send('presentation:ended', endedEvent);
    } else {
      // Send updated slide data
      presentWindow.webContents.send('slide:changed', result);
    }
  } catch (error) {
    console.error('Navigation error:', error);
  }
}

/**
 * Unregister keyboard shortcuts
 */
export function unregisterKeyboardShortcuts(windowManager: WindowManager): void {
  const presentWindow = windowManager.getPresentationWindow();

  if (presentWindow) {
    presentWindow.webContents.removeAllListeners('before-input-event');
  }

  // Reset throttle state
  lastNavigationTime = 0;
}
