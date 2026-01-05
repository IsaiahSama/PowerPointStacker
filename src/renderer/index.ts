/**
 * PowerPoint Stacker - Renderer Process Entry Point
 *
 * This file is loaded by Vite and runs in the renderer (browser) context.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

const root = createRoot(rootElement);
root.render(React.createElement(App));

console.log('PowerPoint Stacker renderer initialized');
