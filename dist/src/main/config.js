"use strict";
/**
 * PowerPoint Stacker - Application Configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.getConfig = getConfig;
/**
 * Default application configuration
 */
exports.defaultConfig = {
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
function getConfig() {
    return exports.defaultConfig;
}
//# sourceMappingURL=config.js.map