/**
 * Type declarations for Electron API exposed to renderer process
 */

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
  PresentationEndedEvent,
} from '../../common/types';

/**
 * ElectronAPI exposed to renderer process via contextBridge
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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
