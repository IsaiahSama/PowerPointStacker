"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const types_1 = require("../../../common/types");
const SlideDisplay_1 = require("./SlideDisplay");
const NavigationBar_1 = require("./NavigationBar");
const ProgressBar_1 = require("./ProgressBar");
const EndScreen_1 = require("./EndScreen");
function PresentView({ onExit }) {
    const [slideData, setSlideData] = (0, react_1.useState)(null);
    const [showEndScreen, setShowEndScreen] = (0, react_1.useState)(false);
    const [endStats, setEndStats] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        window.electronAPI.onSlideChanged((data) => {
            setSlideData(data);
            setShowEndScreen(false);
        });
        window.electronAPI.onPresentationEnded((data) => {
            setShowEndScreen(true);
            setEndStats(data);
        });
        loadCurrentSlide();
        const handleKeyDown = (e) => {
            if (showEndScreen)
                return;
            switch (e.key) {
                case 'ArrowRight':
                    handleNavigate(types_1.NavigationDirection.NEXT);
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    handleNavigate(types_1.NavigationDirection.PREVIOUS);
                    e.preventDefault();
                    break;
                case 'PageDown':
                    if (e.ctrlKey) {
                        handleNavigate(types_1.NavigationDirection.NEXT_PRESENTATION);
                        e.preventDefault();
                    }
                    break;
                case 'PageUp':
                    if (e.ctrlKey) {
                        handleNavigate(types_1.NavigationDirection.PREVIOUS_PRESENTATION);
                        e.preventDefault();
                    }
                    break;
                case 'Escape':
                    handleExit();
                    e.preventDefault();
                    break;
                case 'Home':
                    handleNavigate(types_1.NavigationDirection.FIRST_SLIDE);
                    e.preventDefault();
                    break;
                case 'End':
                    handleNavigate(types_1.NavigationDirection.LAST_SLIDE);
                    e.preventDefault();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEndScreen]);
    const loadCurrentSlide = async () => {
        try {
            const response = await window.electronAPI.getCurrentSlide();
            if (response.success && response.data) {
                setSlideData(response.data);
            }
        }
        catch (err) {
            console.error('Error loading current slide:', err);
        }
    };
    const handleNavigate = async (direction) => {
        try {
            const response = await window.electronAPI.navigate({ direction });
            if (response.success) {
                if (response.data) {
                    setSlideData(response.data);
                    setShowEndScreen(false);
                }
                else {
                    setShowEndScreen(true);
                }
            }
        }
        catch (err) {
            console.error('Error navigating:', err);
        }
    };
    const handleExit = async () => {
        try {
            await window.electronAPI.stopPresentation();
            onExit();
        }
        catch (err) {
            console.error('Error stopping presentation:', err);
        }
    };
    if (showEndScreen) {
        return (0, jsx_runtime_1.jsx)(EndScreen_1.EndScreen, { onExit: handleExit, stats: endStats || undefined });
    }
    if (!slideData) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "present-view loading", children: (0, jsx_runtime_1.jsx)("div", { className: "loading-message", children: "Loading presentation..." }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "present-view", children: [(0, jsx_runtime_1.jsx)(SlideDisplay_1.SlideDisplay, { slide: slideData.slide }), (0, jsx_runtime_1.jsx)(NavigationBar_1.NavigationBar, { slideData: slideData, onNavigate: handleNavigate }), (0, jsx_runtime_1.jsx)(ProgressBar_1.ProgressBar, { slideData: slideData })] }));
}
exports.PresentView = PresentView;
//# sourceMappingURL=PresentView.js.map