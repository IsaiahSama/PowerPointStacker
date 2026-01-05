import React from 'react';

interface StartButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function StartButton({ onClick, disabled = false }: StartButtonProps) {
  return (
    <button
      className="start-button"
      onClick={onClick}
      disabled={disabled}
    >
      Start Presentation (Fullscreen)
    </button>
  );
}
