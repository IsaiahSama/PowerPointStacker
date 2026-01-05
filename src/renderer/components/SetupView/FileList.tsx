import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { PresentationFile, UUID } from '../../../common/types';
import { FileListItem } from './FileListItem';

interface FileListProps {
  presentations: PresentationFile[];
  onRemove: (id: UUID) => void;
  onReorder: (newOrder: UUID[]) => void;
}

export function FileList({ presentations, onRemove, onReorder }: FileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = presentations.findIndex(p => p.id === active.id);
      const newIndex = presentations.findIndex(p => p.id === over.id);

      const newPresentations = [...presentations];
      const [removed] = newPresentations.splice(oldIndex, 1);
      newPresentations.splice(newIndex, 0, removed);

      const newOrder = newPresentations.map(p => p.id);
      onReorder(newOrder);
    }
  };

  if (presentations.length === 0) {
    return (
      <div className="file-list-empty">
        <p>No presentations loaded</p>
        <p className="hint">Click "Add Presentations" to get started</p>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        Loaded Presentations ({presentations.length})
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={presentations.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="file-list">
            {presentations.map((presentation, index) => (
              <FileListItem
                key={presentation.id}
                presentation={presentation}
                index={index}
                onRemove={() => onRemove(presentation.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
