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
initTensorFlow().then(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});