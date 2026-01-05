import React from 'react';
import type { SlideDataResponse } from '../../../common/types';

interface ProgressBarProps {
  slideData: SlideDataResponse;
}

export function ProgressBar({ slideData }: ProgressBarProps) {
  const presentationProgress =
    (slideData.currentSlideNumber / slideData.totalSlidesInPresentation) * 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-info">
        Presentation {slideData.currentPresentationIndex} of {slideData.totalPresentations}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${presentationProgress}%` }}
        />
      </div>
    </div>
  );
}
