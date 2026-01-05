"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFilesButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function AddFilesButton({ onClick, disabled = false }) {
    return ((0, jsx_runtime_1.jsxs)("button", { className: "add-files-button", onClick: onClick, disabled: disabled, children: [(0, jsx_runtime_1.jsx)("span", { className: "button-icon", children: "+" }), "Add Presentations"] }));
}
exports.AddFilesButton = AddFilesButton;
//# sourceMappingURL=AddFilesButton.js.map