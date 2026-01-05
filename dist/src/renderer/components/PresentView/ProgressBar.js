"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = ProgressBar;
const react_1 = __importDefault(require("react"));
function ProgressBar({ slideData }) {
    const presentationProgress = (slideData.currentSlideNumber / slideData.totalSlidesInPresentation) * 100;
    return (<div className="progress-bar-container">
      <div className="progress-info">
        Presentation {slideData.currentPresentationIndex + 1} of {slideData.totalPresentations}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${presentationProgress}%` }}/>
      </div>
    </div>);
}
//# sourceMappingURL=ProgressBar.js.map