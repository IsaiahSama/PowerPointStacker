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
exports.SetupView = SetupView;
const react_1 = __importStar(require("react"));
const FileList_1 = require("./FileList");
const AddFilesButton_1 = require("./AddFilesButton");
const StartButton_1 = require("./StartButton");
function SetupView({ onStartPresentation }) {
    const [presentations, setPresentations] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        loadQueue();
        window.electronAPI.onQueueUpdated((queue) => {
            const orderedPresentations = queue.order.map(id => queue.presentations[id]);
            setPresentations(orderedPresentations);
        });
    }, []);
    const loadQueue = async () => {
        try {
            const response = await window.electronAPI.getQueue();
            if (response.success && response.data) {
                const orderedPresentations = response.data.order.map(id => response.data.presentations[id]);
                setPresentations(orderedPresentations);
            }
        }
        catch (err) {
            setError('Failed to load presentation queue');
            console.error('Error loading queue:', err);
        }
    };
    const handleAddFiles = async () => {
        try {
            setError(null);
            const dialogResult = await window.electronAPI.openFileDialog();
            if (dialogResult.success && !dialogResult.data?.canceled) {
                if (dialogResult.data.filePaths.length > 0) {
                    setIsLoading(true);
                    const addResult = await window.electronAPI.addPresentations({
                        filePaths: dialogResult.data.filePaths
                    });
                    setIsLoading(false);
                    if (addResult.success && addResult.data.failed.length > 0) {
                        const failedList = addResult.data.failed
                            .map(f => `${f.filePath}: ${f.error}`)
                            .join('\n');
                        setError(`Failed to load ${addResult.data.failed.length} file(s):\n${failedList}`);
                    }
                }
            }
        }
        catch (err) {
            setIsLoading(false);
            setError('An error occurred while adding files');
            console.error('Error adding files:', err);
        }
    };
    const handleRemove = async (id) => {
        try {
            setError(null);
            const result = await window.electronAPI.removePresentation({ presentationId: id });
            if (!result.success) {
                setError(`Failed to remove presentation: ${result.error?.message}`);
            }
        }
        catch (err) {
            setError('An error occurred while removing presentation');
            console.error('Error removing presentation:', err);
        }
    };
    const handleReorder = async (newOrder) => {
        try {
            setError(null);
            const result = await window.electronAPI.reorderPresentations({ order: newOrder });
            if (!result.success) {
                setError(`Failed to reorder presentations: ${result.error?.message}`);
            }
        }
        catch (err) {
            setError('An error occurred while reordering presentations');
            console.error('Error reordering presentations:', err);
        }
    };
    const handleStart = async () => {
        if (presentations.length === 0)
            return;
        try {
            setError(null);
            const response = await window.electronAPI.startPresentation({});
            if (response.success) {
                onStartPresentation();
            }
            else {
                setError(`Failed to start presentation: ${response.error?.message}`);
            }
        }
        catch (err) {
            setError('An error occurred while starting presentation');
            console.error('Error starting presentation:', err);
        }
    };
    const totalSlides = presentations.reduce((sum, p) => sum + p.slideCount, 0);
    return (<div className="setup-view">
      <header className="setup-header">
        <h1>PowerPoint Stacker - Setup</h1>
      </header>

      <div className="setup-content">
        <AddFilesButton_1.AddFilesButton onClick={handleAddFiles} disabled={isLoading}/>

        {error && (<div className="error-message">
            {error}
          </div>)}

        <FileList_1.FileList presentations={presentations} onRemove={handleRemove} onReorder={handleReorder}/>
      </div>

      <footer className="setup-footer">
        <div className="stats">
          Total: {presentations.length} presentations, {totalSlides} slides
        </div>
        <StartButton_1.StartButton onClick={handleStart} disabled={presentations.length === 0 || isLoading}/>
      </footer>
    </div>);
}
//# sourceMappingURL=SetupView.js.map