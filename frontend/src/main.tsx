

// ============================================
// FILE 3: frontend/src/main.tsx
// Entry point for React app with Vite
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);


// ============================================
// FILE 4: frontend/src/vite-env.d.ts
// TypeScript definitions for Vite
// ============================================

/// <reference types="vite/client" />

// interface ImportMetaEnv {
//   readonly VITE_API_URL: string;
//   readonly VITE_WS_URL: string;
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }

