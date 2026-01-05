import React from 'react';

interface AddFilesButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddFilesButton({ onClick, disabled = false }: AddFilesButtonProps) {
  return (
    <button
      className="add-files-button"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="button-icon">+</span>
      Add Presentations
    </button>
  );
}
