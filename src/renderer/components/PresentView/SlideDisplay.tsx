import React from 'react';
import type { Slide } from '../../../common/types';

interface SlideDisplayProps {
  slide: Slide;
}

export function SlideDisplay({ slide }: SlideDisplayProps) {
  return (
    <div className="slide-display">
      <img
        src={slide.imageData}
        alt={`Slide ${slide.slideNumber}`}
        className="slide-image"
      />
    </div>
  );
}
