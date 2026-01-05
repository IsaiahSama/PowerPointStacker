"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function StartButton({ onClick, disabled = false }) {
    return ((0, jsx_runtime_1.jsx)("button", { className: "start-button", onClick: onClick, disabled: disabled, children: "Start Presentation (Fullscreen)" }));
}
exports.StartButton = StartButton;
//# sourceMappingURL=StartButton.js.map