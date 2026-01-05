/**
 * PowerPoint Stacker - Application Configuration
 */

import type { AppConfig } from '../common/types';

/**
 * Default application configuration
 */
export const defaultConfig: AppConfig = {
  setupWindow: {
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 400
  },

  presentWindow: {
    fullscreen: true,
    backgroundColor: '#000000'
  },

  shortcuts: {
    nextSlide: 'ArrowRight',
    previousSlide: 'ArrowLeft',
    nextPresentation: 'Control+PageDown',
    previousPresentation: 'Control+PageUp',
    exitPresentation: 'Escape'
  },

  slideRendering: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 90,
    format: 'png'
  }
};

/**
 * Get configuration value
 */
export function getConfig(): AppConfig {
  return defaultConfig;
}
