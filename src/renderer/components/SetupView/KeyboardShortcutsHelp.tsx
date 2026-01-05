import React from 'react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    keys: ['→', 'Right Arrow'],
    description: 'Next slide'
  },
  {
    keys: ['←', 'Left Arrow'],
    description: 'Previous slide'
  },
  {
    keys: ['Ctrl', '+', 'Page Down'],
    description: 'Next presentation'
  },
  {
    keys: ['Ctrl', '+', 'Page Up'],
    description: 'Previous presentation'
  },
  {
    keys: ['Home'],
    description: 'First slide of current presentation'
  },
  {
    keys: ['End'],
    description: 'Last slide of current presentation'
  },
  {
    keys: ['Esc'],
    description: 'Exit presentation mode'
  }
];

export function KeyboardShortcutsHelp() {
  return (
    <div className="keyboard-shortcuts-help">
      <div className="help-header">
        <span className="help-icon">⌨️</span>
        <h3>Keyboard Shortcuts</h3>
      </div>

      <div className="shortcuts-list">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="shortcut-item">
            <div className="shortcut-keys">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="key">{key}</kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="key-separator">{key === 'Ctrl' ? '' : ' / '}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="shortcut-description">{shortcut.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
