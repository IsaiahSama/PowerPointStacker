/**
 * PowerPoint Stacker - Preload Script
 * Exposes safe, whitelisted APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';
import type {
  IPCResponse,
  AddPresentationsRequest,
  AddPresentationsResponse,
  RemovePresentationRequest,
  ReorderPresentationsRequest,
  StartPresentationRequest,
  NavigateRequest,
  SlideDataResponse,
  PresentationQueue,
  PresentationEndedEvent
} from './types';

/**
 * ElectronAPI exposed to renderer process
 */
export interface ElectronAPI {
  // Presentation management
  addPresentations(request: AddPresentationsRequest): Promise<IPCResponse<AddPresentationsResponse>>;
  removePresentation(request: RemovePresentationRequest): Promise<IPCResponse<void>>;
  reorderPresentations(request: ReorderPresentationsRequest): Promise<IPCResponse<void>>;
  getQueue(): Promise<IPCResponse<PresentationQueue>>;
  clearQueue(): Promise<IPCResponse<void>>;

  // Presentation mode
  startPresentation(request: StartPresentationRequest): Promise<IPCResponse<SlideDataResponse>>;
  stopPresentation(): Promise<IPCResponse<void>>;
  navigate(request: NavigateRequest): Promise<IPCResponse<SlideDataResponse | null>>;
  getCurrentSlide(): Promise<IPCResponse<SlideDataResponse | null>>;

  // File dialog
  openFileDialog(): Promise<IPCResponse<{ filePaths: string[]; canceled: boolean }>>;

  // Event listeners
  onQueueUpdated(callback: (queue: PresentationQueue) => void): () => void;
  onSlideChanged(callback: (data: SlideDataResponse) => void): () => void;
  onPresentationEnded(callback: (data: PresentationEndedEvent) => void): () => void;

  // Utility
  quitApp(): void;
}

// Expose protected API to renderer
const electronAPI: ElectronAPI = {
  // Presentation management
  addPresentations: (request) =>
    ipcRenderer.invoke('presentation:add', request),

  removePresentation: (request) =>
    ipcRenderer.invoke('presentation:remove', request),

  reorderPresentations: (request) =>
    ipcRenderer.invoke('presentation:reorder', request),

  getQueue: () =>
    ipcRenderer.invoke('presentation:getQueue'),

  clearQueue: () =>
    ipcRenderer.invoke('presentation:clear'),

  // Presentation mode
  startPresentation: (request) =>
    ipcRenderer.invoke('present:start', request),

  stopPresentation: () =>
    ipcRenderer.invoke('present:stop'),

  navigate: (request) =>
    ipcRenderer.invoke('present:navigate', request),

  getCurrentSlide: () =>
    ipcRenderer.invoke('present:getCurrentSlide'),

  // File dialog
  openFileDialog: () =>
    ipcRenderer.invoke('dialog:openFiles'),

  // Event listeners
  onQueueUpdated: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, queue: PresentationQueue) => callback(queue);
    ipcRenderer.on('presentation:queueUpdated', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('presentation:queueUpdated', listener);
  },

  onSlideChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, data: SlideDataResponse) => callback(data);
    ipcRenderer.on('slide:changed', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('slide:changed', listener);
  },

  onPresentationEnded: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, data: PresentationEndedEvent) => callback(data);
    ipcRenderer.on('presentation:ended', listener);
    // Return cleanup function
    return () => ipcRenderer.removeListener('presentation:ended', listener);
  },

  // Utility
  quitApp: () => {
    ipcRenderer.send('app:quit');
  }
};

// Expose API to window object
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
