"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "setup-view", children: [(0, jsx_runtime_1.jsx)("header", { className: "setup-header", children: (0, jsx_runtime_1.jsx)("h1", { children: "PowerPoint Stacker - Setup" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "setup-content", children: [(0, jsx_runtime_1.jsx)(AddFilesButton_1.AddFilesButton, { onClick: handleAddFiles, disabled: isLoading }), error && ((0, jsx_runtime_1.jsx)("div", { className: "error-message", children: error })), (0, jsx_runtime_1.jsx)(FileList_1.FileList, { presentations: presentations, onRemove: handleRemove, onReorder: handleReorder })] }), (0, jsx_runtime_1.jsxs)("footer", { className: "setup-footer", children: [(0, jsx_runtime_1.jsxs)("div", { className: "stats", children: ["Total: ", presentations.length, " presentations, ", totalSlides, " slides"] }), (0, jsx_runtime_1.jsx)(StartButton_1.StartButton, { onClick: handleStart, disabled: presentations.length === 0 || isLoading })] })] }));
}
exports.SetupView = SetupView;
//# sourceMappingURL=SetupView.js.map