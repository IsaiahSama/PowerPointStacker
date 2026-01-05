"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileList = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
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
        return ((0, jsx_runtime_1.jsxs)("div", { className: "file-list-empty", children: [(0, jsx_runtime_1.jsx)("p", { children: "No presentations loaded" }), (0, jsx_runtime_1.jsx)("p", { className: "hint", children: "Click \"Add Presentations\" to get started" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "file-list-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "file-list-header", children: ["Loaded Presentations (", presentations.length, ")"] }), (0, jsx_runtime_1.jsx)(core_1.DndContext, { sensors: sensors, collisionDetection: core_1.closestCenter, onDragEnd: handleDragEnd, children: (0, jsx_runtime_1.jsx)(sortable_1.SortableContext, { items: presentations.map(p => p.id), strategy: sortable_1.verticalListSortingStrategy, children: (0, jsx_runtime_1.jsx)("div", { className: "file-list", children: presentations.map((presentation, index) => ((0, jsx_runtime_1.jsx)(FileListItem_1.FileListItem, { presentation: presentation, index: index, onRemove: () => onRemove(presentation.id) }, presentation.id))) }) }) })] }));
}
exports.FileList = FileList;
//# sourceMappingURL=FileList.js.map