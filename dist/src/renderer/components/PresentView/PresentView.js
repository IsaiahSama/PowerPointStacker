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
exports.PresentView = PresentView;
const react_1 = __importStar(require("react"));
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
        return <EndScreen_1.EndScreen onExit={handleExit} stats={endStats || undefined}/>;
    }
    if (!slideData) {
        return (<div className="present-view loading">
        <div className="loading-message">Loading presentation...</div>
      </div>);
    }
    return (<div className="present-view">
      <SlideDisplay_1.SlideDisplay slide={slideData.slide}/>
      <NavigationBar_1.NavigationBar slideData={slideData} onNavigate={handleNavigate}/>
      <ProgressBar_1.ProgressBar slideData={slideData}/>
    </div>);
}
//# sourceMappingURL=PresentView.js.map