"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndScreen = EndScreen;
const react_1 = __importDefault(require("react"));
function EndScreen({ onExit, stats }) {
    const handleClose = () => {
        window.electronAPI.quitApp();
    };
    return (<div className="end-screen">
      <div className="end-screen-content">
        <div className="checkmark">✓</div>
        <h1>Presentation Complete</h1>
        <p>You have reached the end of all presentations.</p>

        {stats && (<div className="stats">
            <div className="stat-item">
              <div className="stat-value">{stats.totalPresentationsShown}</div>
              <div className="stat-label">presentations shown</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.totalSlidesShown}</div>
              <div className="stat-label">slides total</div>
            </div>
          </div>)}

        <div className="actions">
          <button className="action-button primary" onClick={onExit}>
            Return to Setup
          </button>
          <button className="action-button secondary" onClick={handleClose}>
            Close Application
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=EndScreen.js.map