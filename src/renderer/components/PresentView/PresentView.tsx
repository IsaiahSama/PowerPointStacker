import React, { useState, useEffect } from 'react';
import type { SlideDataResponse, PresentationEndedEvent } from '../../../common/types';
import { NavigationDirection } from '../../../common/types';
import { SlideDisplay } from './SlideDisplay';
import { NavigationBar } from './NavigationBar';
import { ProgressBar } from './ProgressBar';
import { EndScreen } from './EndScreen';

interface PresentViewProps {
  onExit: () => void;
}

export function PresentView({ onExit }: PresentViewProps) {
  const [slideData, setSlideData] = useState<SlideDataResponse | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [endStats, setEndStats] = useState<PresentationEndedEvent | null>(null);

  useEffect(() => {
    window.electronAPI.onSlideChanged((data: SlideDataResponse) => {
      setSlideData(data);
      setShowEndScreen(false);
    });

    window.electronAPI.onPresentationEnded((data: PresentationEndedEvent) => {
      setShowEndScreen(true);
      setEndStats(data);
    });

    loadCurrentSlide();

    // Note: Keyboard shortcuts are handled by the main process (keyboardShortcuts.ts)
    // to prevent duplicate events and ensure consistent behavior
  }, []);

  const loadCurrentSlide = async () => {
    try {
      const response = await window.electronAPI.getCurrentSlide();
      if (response.success && response.data) {
        setSlideData(response.data);
      }
    } catch (err) {
      console.error('Error loading current slide:', err);
    }
  };

  const handleNavigate = async (direction: NavigationDirection) => {
    try {
      const response = await window.electronAPI.navigate({ direction });

      if (response.success) {
        if (response.data) {
          setSlideData(response.data);
          setShowEndScreen(false);
        } else {
          setShowEndScreen(true);
        }
      }
    } catch (err) {
      console.error('Error navigating:', err);
    }
  };

  const handleExit = async () => {
    try {
      await window.electronAPI.stopPresentation();
      onExit();
    } catch (err) {
      console.error('Error stopping presentation:', err);
    }
  };

  if (showEndScreen) {
    return <EndScreen onExit={handleExit} stats={endStats || undefined} />;
  }

  if (!slideData) {
    return (
      <div className="present-view loading">
        <div className="loading-message">Loading presentation...</div>
      </div>
    );
  }

  return (
    <div className="present-view">
      <SlideDisplay slide={slideData.slide} />
      <NavigationBar slideData={slideData} onNavigate={handleNavigate} />
      <ProgressBar slideData={slideData} />
    </div>
  );
}
