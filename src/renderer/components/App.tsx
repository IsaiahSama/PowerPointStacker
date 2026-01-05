import React, { useState } from 'react';
import { AppMode } from '../../common/types';
import { SetupView } from './SetupView/SetupView';
import { PresentView } from './PresentView/PresentView';

export function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.SETUP);

  const handleStartPresentation = () => {
    setMode(AppMode.PRESENTING);
  };

  const handleExitPresentation = () => {
    setMode(AppMode.SETUP);
  };

  return (
    <div className="app">
      {mode === AppMode.SETUP ? (
        <SetupView onStartPresentation={handleStartPresentation} />
      ) : (
        <PresentView onExit={handleExitPresentation} />
      )}
    </div>
  );
}
