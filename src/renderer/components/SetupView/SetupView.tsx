import React, { useState, useEffect } from 'react';
import type { PresentationFile, PresentationQueue, UUID } from '../../../common/types';
import { FileList } from './FileList';
import { AddFilesButton } from './AddFilesButton';
import { StartButton } from './StartButton';

interface SetupViewProps {
  onStartPresentation: () => void;
}

export function SetupView({ onStartPresentation }: SetupViewProps) {
  const [presentations, setPresentations] = useState<PresentationFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();

    window.electronAPI.onQueueUpdated((queue: PresentationQueue) => {
      const orderedPresentations = queue.order.map(id => queue.presentations[id]);
      setPresentations(orderedPresentations);
    });
  }, []);

  const loadQueue = async () => {
    try {
      const response = await window.electronAPI.getQueue();
      if (response.success && response.data) {
        const orderedPresentations = response.data.order.map(
          id => response.data!.presentations[id]
        );
        setPresentations(orderedPresentations);
      }
    } catch (err) {
      setError('Failed to load presentation queue');
      console.error('Error loading queue:', err);
    }
  };

  const handleAddFiles = async () => {
    try {
      setError(null);
      const dialogResult = await window.electronAPI.openFileDialog();

      if (dialogResult.success && !dialogResult.data?.canceled) {
        if (dialogResult.data!.filePaths.length > 0) {
          setIsLoading(true);
          const addResult = await window.electronAPI.addPresentations({
            filePaths: dialogResult.data!.filePaths
          });
          setIsLoading(false);

          if (addResult.success && addResult.data!.failed.length > 0) {
            const failedList = addResult.data!.failed
              .map(f => `${f.filePath}: ${f.error}`)
              .join('\n');
            setError(`Failed to load ${addResult.data!.failed.length} file(s):\n${failedList}`);
          }
        }
      }
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred while adding files');
      console.error('Error adding files:', err);
    }
  };

  const handleRemove = async (id: UUID) => {
    try {
      setError(null);
      const result = await window.electronAPI.removePresentation({ presentationId: id });
      if (!result.success) {
        setError(`Failed to remove presentation: ${result.error?.message}`);
      }
    } catch (err) {
      setError('An error occurred while removing presentation');
      console.error('Error removing presentation:', err);
    }
  };

  const handleReorder = async (newOrder: UUID[]) => {
    try {
      setError(null);
      const result = await window.electronAPI.reorderPresentations({ order: newOrder });
      if (!result.success) {
        setError(`Failed to reorder presentations: ${result.error?.message}`);
      }
    } catch (err) {
      setError('An error occurred while reordering presentations');
      console.error('Error reordering presentations:', err);
    }
  };

  const handleStart = async () => {
    if (presentations.length === 0) return;

    try {
      setError(null);
      const response = await window.electronAPI.startPresentation({});
      if (response.success) {
        onStartPresentation();
      } else {
        setError(`Failed to start presentation: ${response.error?.message}`);
      }
    } catch (err) {
      setError('An error occurred while starting presentation');
      console.error('Error starting presentation:', err);
    }
  };

  const totalSlides = presentations.reduce((sum, p) => sum + p.slideCount, 0);

  return (
    <div className="setup-view">
      <header className="setup-header">
        <h1>PowerPoint Stacker - Setup</h1>
      </header>

      <div className="setup-content">
        <AddFilesButton onClick={handleAddFiles} disabled={isLoading} />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <FileList
          presentations={presentations}
          onRemove={handleRemove}
          onReorder={handleReorder}
        />
      </div>

      <footer className="setup-footer">
        <div className="stats">
          Total: {presentations.length} presentations, {totalSlides} slides
        </div>
        <StartButton
          onClick={handleStart}
          disabled={presentations.length === 0 || isLoading}
        />
      </footer>
    </div>
  );
}
