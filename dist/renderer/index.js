"use strict";
/**
 * PowerPoint Stacker - Renderer Process Entry Point
 *
 * This file is loaded by Vite and runs in the renderer (browser) context.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const App_1 = require("./components/App");
require("./index.css");
const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Failed to find root element');
}
const root = (0, client_1.createRoot)(rootElement);
root.render(react_1.default.createElement(App_1.App));
console.log('PowerPoint Stacker renderer initialized');
//# sourceMappingURL=index.js.map