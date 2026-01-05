import React from 'react';

interface StartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function StartButton({ onClick, disabled = false, loading = false }: StartButtonProps) {
  return (
    <button
      className="start-button"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="loading-spinner"></span>
          Preparing slides...
        </>
      ) : (
        'Start Presentation (Fullscreen)'
      )}
    </button>
  );
}
