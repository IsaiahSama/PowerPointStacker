"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlideDisplay = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function SlideDisplay({ slide }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: "slide-display", children: (0, jsx_runtime_1.jsx)("img", { src: slide.imageData, alt: `Slide ${slide.slideNumber}`, className: "slide-image" }) }));
}
exports.SlideDisplay = SlideDisplay;
//# sourceMappingURL=SlideDisplay.js.map