import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PresentationFile } from '../../../common/types';

interface FileListItemProps {
  presentation: PresentationFile;
  index: number;
  onRemove: () => void;
}

export function FileListItem({ presentation, index, onRemove }: FileListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: presentation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={'file-list-item ' + (isDragging ? 'dragging' : '')}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <span className="drag-icon">≡</span>
      </div>

      <div className="item-number">{index + 1}.</div>

      <div className="item-info">
        <div className="item-name">{presentation.name}</div>
        <div className="item-meta">
          {presentation.slideCount} slides • {formatFileSize(presentation.fileSize)}
        </div>
      </div>

      <button
        className="remove-button"
        onClick={onRemove}
        title="Remove presentation"
      >
        ×
      </button>
    </div>
  );
}
