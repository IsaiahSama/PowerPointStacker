"use strict";
/**
 * PowerPoint Stacker - Preload Script
 * Exposes safe, whitelisted APIs to the renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected API to renderer
const electronAPI = {
    // Presentation management
    addPresentations: (request) => electron_1.ipcRenderer.invoke('presentation:add', request),
    removePresentation: (request) => electron_1.ipcRenderer.invoke('presentation:remove', request),
    reorderPresentations: (request) => electron_1.ipcRenderer.invoke('presentation:reorder', request),
    getQueue: () => electron_1.ipcRenderer.invoke('presentation:getQueue'),
    clearQueue: () => electron_1.ipcRenderer.invoke('presentation:clear'),
    // Presentation mode
    startPresentation: (request) => electron_1.ipcRenderer.invoke('present:start', request),
    stopPresentation: () => electron_1.ipcRenderer.invoke('present:stop'),
    navigate: (request) => electron_1.ipcRenderer.invoke('present:navigate', request),
    getCurrentSlide: () => electron_1.ipcRenderer.invoke('present:getCurrentSlide'),
    // File dialog
    openFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openFiles'),
    // Event listeners
    onQueueUpdated: (callback) => {
        const listener = (_event, queue) => callback(queue);
        electron_1.ipcRenderer.on('presentation:queueUpdated', listener);
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeListener('presentation:queueUpdated', listener);
    },
    onSlideChanged: (callback) => {
        const listener = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('slide:changed', listener);
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeListener('slide:changed', listener);
    },
    onPresentationEnded: (callback) => {
        const listener = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('presentation:ended', listener);
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeListener('presentation:ended', listener);
    },
    // Utility
    quitApp: () => {
        electron_1.ipcRenderer.send('app:quit');
    }
};
// Expose API to window object
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map