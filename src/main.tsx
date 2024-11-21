import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTensorFlow } from './utils/tensorflow/init';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Initialize TensorFlow before rendering
initTensorFlow().then((success) => {
  if (!success) {
    console.error('Failed to initialize TensorFlow.js');
  }
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch(error => {
  console.error('Critical error initializing TensorFlow.js:', error);
  // Still render the app, as some features might work without TensorFlow
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});