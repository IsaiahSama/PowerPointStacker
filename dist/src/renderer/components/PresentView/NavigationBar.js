"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationBar = NavigationBar;
const react_1 = __importDefault(require("react"));
const types_1 = require("../../../common/types");
function NavigationBar({ slideData, onNavigate }) {
    const isPrevDisabled = slideData.isFirstSlide && slideData.isFirstPresentation;
    return (<div className="navigation-bar">
      <button className="nav-button prev-button" onClick={() => onNavigate(types_1.NavigationDirection.PREVIOUS)} disabled={isPrevDisabled}>
        ◀ Previous
      </button>

      <div className="slide-info">
        <div className="presentation-name">{slideData.presentationName}</div>
        <div className="slide-counter">
          Slide {slideData.currentSlideNumber} of {slideData.totalSlidesInPresentation}
        </div>
      </div>

      <button className="nav-button next-button" onClick={() => onNavigate(types_1.NavigationDirection.NEXT)}>
        Next ▶
      </button>
    </div>);
}
//# sourceMappingURL=NavigationBar.js.map