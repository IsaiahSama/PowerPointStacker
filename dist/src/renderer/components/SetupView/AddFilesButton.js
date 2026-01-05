"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFilesButton = AddFilesButton;
const react_1 = __importDefault(require("react"));
function AddFilesButton({ onClick, disabled = false }) {
    return (<button className="add-files-button" onClick={onClick} disabled={disabled}>
      <span className="button-icon">+</span>
      Add Presentations
    </button>);
}
//# sourceMappingURL=AddFilesButton.js.map