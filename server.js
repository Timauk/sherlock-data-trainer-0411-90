import express from 'express';
import cors from 'cors';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
import compression from 'compression';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações básicas
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://lovable.dev'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compressão gzip para todas as respostas
app.use(compression());

// Aumentar limite de payload para 100mb
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));
app.use(cacheMiddleware);

import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';
import { processingRouter } from './routes/model/processing.js';

// Create necessary directories with absolute paths
const dirs = [
  path.join(__dirname, 'checkpoints'),
  path.join(__dirname, 'logs'),
  path.join(__dirname, 'saved-models'),
  path.join(__dirname, 'cache'),
  path.join(__dirname, 'cache/predictions'),
  path.join(__dirname, 'cache/models'),
  path.join(__dirname, 'cache/static')
].filter(Boolean);

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

// Apply routes
app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);
app.use('/api/processing', processingRouter);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Initialize TensorFlow.js
await tf.ready().then(() => {
  logger.info('TensorFlow.js initialized successfully');
}).catch(error => {
  logger.error('Error initializing TensorFlow.js:', error);
});

// Monitoramento de memória
setInterval(() => {
  const usage = process.memoryUsage();
  logger.info('Server Memory Usage:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
  });
}, 300000);

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
  logger.info(`Cache directory: ${path.join(__dirname, 'cache')}`);
});