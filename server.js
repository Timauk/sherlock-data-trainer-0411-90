import express from 'express';
import cors from 'cors';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Basic configurations
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use(cacheMiddleware);

// Routes
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';
import { processingRouter } from './routes/model/processing.js';

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Apply routes
app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);
app.use('/api/processing', processingRouter);

// Create necessary directories
const dirs = [
  path.join(__dirname, 'checkpoints'),
  path.join(__dirname, 'logs'),
  path.join(__dirname, 'saved-models')
];

// Create directories if they don't exist
await Promise.all(
  dirs.map(async (dir) => {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Directory created: ${dir}`);
    }
  })
);

// Initialize TensorFlow.js
await tf.ready().then(() => {
  logger.info('TensorFlow.js initialized successfully');
}).catch(error => {
  logger.error('Error initializing TensorFlow.js:', error);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`Checkpoints directory: ${path.join(__dirname, 'checkpoints')}`);
  logger.info(`Logs directory: ${path.join(__dirname, 'logs')}`);
  logger.info(`Saved models directory: ${path.join(__dirname, 'saved-models')}`);
});