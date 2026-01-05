"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileList = FileList;
const react_1 = __importDefault(require("react"));
const core_1 = require("@dnd-kit/core");
const sortable_1 = require("@dnd-kit/sortable");
const FileListItem_1 = require("./FileListItem");
function FileList({ presentations, onRemove, onReorder }) {
    const sensors = (0, core_1.useSensors)((0, core_1.useSensor)(core_1.PointerSensor), (0, core_1.useSensor)(core_1.KeyboardSensor, {
        coordinateGetter: sortable_1.sortableKeyboardCoordinates,
    }));
    const handleDragEnd = (event) => {
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
        return (<div className="file-list-empty">
        <p>No presentations loaded</p>
        <p className="hint">Click "Add Presentations" to get started</p>
      </div>);
    }
    return (<div className="file-list-container">
      <div className="file-list-header">
        Loaded Presentations ({presentations.length})
      </div>

      <core_1.DndContext sensors={sensors} collisionDetection={core_1.closestCenter} onDragEnd={handleDragEnd}>
        <sortable_1.SortableContext items={presentations.map(p => p.id)} strategy={sortable_1.verticalListSortingStrategy}>
          <div className="file-list">
            {presentations.map((presentation, index) => (<FileListItem_1.FileListItem key={presentation.id} presentation={presentation} index={index} onRemove={() => onRemove(presentation.id)}/>))}
          </div>
        </sortable_1.SortableContext>
      </core_1.DndContext>
    </div>);
}
//# sourceMappingURL=FileList.js.map