"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../../common/types");
const SetupView_1 = require("./SetupView/SetupView");
const PresentView_1 = require("./PresentView/PresentView");
function App() {
    const [mode, setMode] = (0, react_1.useState)(types_1.AppMode.SETUP);
    const handleStartPresentation = () => {
        setMode(types_1.AppMode.PRESENTING);
    };
    const handleExitPresentation = () => {
        setMode(types_1.AppMode.SETUP);
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "app", children: mode === types_1.AppMode.SETUP ? ((0, jsx_runtime_1.jsx)(SetupView_1.SetupView, { onStartPresentation: handleStartPresentation })) : ((0, jsx_runtime_1.jsx)(PresentView_1.PresentView, { onExit: handleExitPresentation })) }));
}
exports.App = App;
//# sourceMappingURL=App.js.map