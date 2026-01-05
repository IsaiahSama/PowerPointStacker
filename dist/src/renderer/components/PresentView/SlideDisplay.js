"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlideDisplay = SlideDisplay;
const react_1 = __importDefault(require("react"));
function SlideDisplay({ slide }) {
    return (<div className="slide-display">
      <img src={slide.imageData} alt={`Slide ${slide.slideNumber}`} className="slide-image"/>
    </div>);
}
//# sourceMappingURL=SlideDisplay.js.map