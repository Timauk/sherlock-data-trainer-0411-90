import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { LRUCache } from 'lru-cache';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Initialize LRU Cache with options
const cache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // Items live for 5 minutes
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cacheMiddleware);

// Routes
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';
import { processingRouter } from './routes/model/processing.js';

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);
app.use('/api/processing', processingRouter);

// Create necessary directories if they don't exist
const checkpointsDir = path.join(__dirname, 'checkpoints');
const logsDir = path.join(__dirname, 'logs');
const savedModelsDir = path.join(__dirname, 'saved-models');

[checkpointsDir, logsDir, savedModelsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// TensorFlow.js configuration using web version
let tfBackend = null;
try {
  const tf = await import('@tensorflow/tfjs');
  await tf.setBackend('cpu');
  tfBackend = 'cpu';
  logger.info('TensorFlow.js web backend configured for CPU');
} catch (error) {
  logger.warn('TensorFlow.js could not be loaded:', error);
}

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Error occurred');
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Memory management
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000); // Clean every 5 minutes

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`Checkpoints directory: ${checkpointsDir}`);
  logger.info(`Logs directory: ${logsDir}`);
  logger.info(`Saved models directory: ${savedModelsDir}`);
});