"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileListItem = FileListItem;
const react_1 = __importDefault(require("react"));
const sortable_1 = require("@dnd-kit/sortable");
const utilities_1 = require("@dnd-kit/utilities");
function FileListItem({ presentation, index, onRemove }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = (0, sortable_1.useSortable)({ id: presentation.id });
    const style = {
        transform: utilities_1.CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (<div ref={setNodeRef} style={style} className={'file-list-item ' + (isDragging ? 'dragging' : '')}>
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

      <button className="remove-button" onClick={onRemove} title="Remove presentation">
        ×
      </button>
    </div>);
}
//# sourceMappingURL=FileListItem.js.map