"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = App;
const react_1 = __importStar(require("react"));
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
    return (<div className="app">
      {mode === types_1.AppMode.SETUP ? (<SetupView_1.SetupView onStartPresentation={handleStartPresentation}/>) : (<PresentView_1.PresentView onExit={handleExitPresentation}/>)}
    </div>);
}
//# sourceMappingURL=App.js.map