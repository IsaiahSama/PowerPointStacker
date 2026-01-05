"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function ProgressBar({ slideData }) {
    const presentationProgress = (slideData.currentSlideNumber / slideData.totalSlidesInPresentation) * 100;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "progress-bar-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "progress-info", children: ["Presentation ", slideData.currentPresentationIndex + 1, " of ", slideData.totalPresentations] }), (0, jsx_runtime_1.jsx)("div", { className: "progress-bar", children: (0, jsx_runtime_1.jsx)("div", { className: "progress-fill", style: { width: `${presentationProgress}%` } }) })] }));
}
exports.ProgressBar = ProgressBar;
//# sourceMappingURL=ProgressBar.js.map