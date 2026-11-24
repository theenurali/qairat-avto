import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { LangProvider } from './lib/lang';
import { ProgressProvider } from './lib/progress';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <ProgressProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </ProgressProvider>
    </HashRouter>
  </StrictMode>,
);
