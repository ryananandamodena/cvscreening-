
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ThemeProvider>
    <LanguageProvider>
      <NotificationProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </NotificationProvider>
    </LanguageProvider>
  </ThemeProvider>
);

