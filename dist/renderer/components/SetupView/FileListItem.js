"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileListItem = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
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
    return ((0, jsx_runtime_1.jsxs)("div", { ref: setNodeRef, style: style, className: 'file-list-item ' + (isDragging ? 'dragging' : ''), children: [(0, jsx_runtime_1.jsx)("div", { className: "drag-handle", ...attributes, ...listeners, children: (0, jsx_runtime_1.jsx)("span", { className: "drag-icon", children: "\u2261" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "item-number", children: [index + 1, "."] }), (0, jsx_runtime_1.jsxs)("div", { className: "item-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "item-name", children: presentation.name }), (0, jsx_runtime_1.jsxs)("div", { className: "item-meta", children: [presentation.slideCount, " slides \u2022 ", formatFileSize(presentation.fileSize)] })] }), (0, jsx_runtime_1.jsx)("button", { className: "remove-button", onClick: onRemove, title: "Remove presentation", children: "\u00D7" })] }));
}
exports.FileListItem = FileListItem;
//# sourceMappingURL=FileListItem.js.map