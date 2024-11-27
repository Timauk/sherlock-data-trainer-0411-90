import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import * as tf from '@tensorflow/tfjs';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Initialize TensorFlow before rendering
tf.ready().then(() => {
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