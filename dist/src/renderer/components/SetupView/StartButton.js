"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartButton = StartButton;
const react_1 = __importDefault(require("react"));
function StartButton({ onClick, disabled = false }) {
    return (<button className="start-button" onClick={onClick} disabled={disabled}>
      Start Presentation (Fullscreen)
    </button>);
}
//# sourceMappingURL=StartButton.js.map