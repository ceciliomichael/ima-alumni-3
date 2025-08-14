import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Create SVG placeholder illustrations directory
const createIllustrations = () => {
  // This is just a placeholder function to simulate creating
  // the necessary illustration files that would normally be in the public folder
  console.log('Creating placeholder illustrations');
};

// Initialize the application
const initApp = () => {
  createIllustrations();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the application
initApp();
