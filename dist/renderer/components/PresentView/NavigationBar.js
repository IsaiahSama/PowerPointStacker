"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const types_1 = require("../../../common/types");
function NavigationBar({ slideData, onNavigate }) {
    const isPrevDisabled = slideData.isFirstSlide && slideData.isFirstPresentation;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "navigation-bar", children: [(0, jsx_runtime_1.jsx)("button", { className: "nav-button prev-button", onClick: () => onNavigate(types_1.NavigationDirection.PREVIOUS), disabled: isPrevDisabled, children: "\u25C0 Previous" }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-info", children: [(0, jsx_runtime_1.jsx)("div", { className: "presentation-name", children: slideData.presentationName }), (0, jsx_runtime_1.jsxs)("div", { className: "slide-counter", children: ["Slide ", slideData.currentSlideNumber, " of ", slideData.totalSlidesInPresentation] })] }), (0, jsx_runtime_1.jsx)("button", { className: "nav-button next-button", onClick: () => onNavigate(types_1.NavigationDirection.NEXT), children: "Next \u25B6" })] }));
}
exports.NavigationBar = NavigationBar;
//# sourceMappingURL=NavigationBar.js.map