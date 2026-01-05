"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndScreen = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
function EndScreen({ onExit, stats }) {
    const handleClose = () => {
        window.electronAPI.quitApp();
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "end-screen", children: (0, jsx_runtime_1.jsxs)("div", { className: "end-screen-content", children: [(0, jsx_runtime_1.jsx)("div", { className: "checkmark", children: "\u2713" }), (0, jsx_runtime_1.jsx)("h1", { children: "Presentation Complete" }), (0, jsx_runtime_1.jsx)("p", { children: "You have reached the end of all presentations." }), stats && ((0, jsx_runtime_1.jsxs)("div", { className: "stats", children: [(0, jsx_runtime_1.jsxs)("div", { className: "stat-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "stat-value", children: stats.totalPresentationsShown }), (0, jsx_runtime_1.jsx)("div", { className: "stat-label", children: "presentations shown" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "stat-item", children: [(0, jsx_runtime_1.jsx)("div", { className: "stat-value", children: stats.totalSlidesShown }), (0, jsx_runtime_1.jsx)("div", { className: "stat-label", children: "slides total" })] })] })), (0, jsx_runtime_1.jsxs)("div", { className: "actions", children: [(0, jsx_runtime_1.jsx)("button", { className: "action-button primary", onClick: onExit, children: "Return to Setup" }), (0, jsx_runtime_1.jsx)("button", { className: "action-button secondary", onClick: handleClose, children: "Close Application" })] })] }) }));
}
exports.EndScreen = EndScreen;
//# sourceMappingURL=EndScreen.js.map