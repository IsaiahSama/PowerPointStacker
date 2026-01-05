import React from 'react';
import type { SlideDataResponse } from '../../../common/types';
import { NavigationDirection } from '../../../common/types';

interface NavigationBarProps {
  slideData: SlideDataResponse;
  onNavigate: (direction: NavigationDirection) => void;
}

export function NavigationBar({ slideData, onNavigate }: NavigationBarProps) {
  const isPrevDisabled = slideData.isFirstSlide && slideData.isFirstPresentation;

  return (
    <div className="navigation-bar">
      <button
        className="nav-button prev-button"
        onClick={() => onNavigate(NavigationDirection.PREVIOUS)}
        disabled={isPrevDisabled}
      >
        ◀ Previous
      </button>

      <div className="slide-info">
        <div className="presentation-name">{slideData.presentationName}</div>
        <div className="slide-counter">
          Slide {slideData.currentSlideNumber} of {slideData.totalSlidesInPresentation}
        </div>
      </div>

      <button
        className="nav-button next-button"
        onClick={() => onNavigate(NavigationDirection.NEXT)}
      >
        Next ▶
      </button>
    </div>
  );
}
