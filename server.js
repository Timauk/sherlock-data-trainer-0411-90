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

// Log initialization
logger.info('\x1b[32m%s\x1b[0m', 'Starting server...', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch
});

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins temporarily for development
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log de requisições em verde
app.use((req, res, next) => {
  logger.info('\x1b[32m%s\x1b[0m', 'Nova requisição:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
});

app.use(compression());
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
      logger.info('\x1b[32m%s\x1b[0m', `Diretório existente: ${dir}`);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info('\x1b[32m%s\x1b[0m', `Diretório criado: ${dir}`);
    }
  })
);

// Apply routes
app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);
app.use('/api/processing', processingRouter);

// Test route with error logging
app.get('/test', (req, res) => {
  logger.info('\x1b[32m%s\x1b[0m', 'Teste de rota acessado');
  res.json({ message: 'Server is running' });
});

// Initialize TensorFlow.js with error handling
try {
  await tf.ready();
  logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js inicializado com sucesso', {
    backend: tf.getBackend(),
    memory: tf.memory()
  });
} catch (error) {
  logger.error('\x1b[31m%s\x1b[0m', 'Erro ao inicializar TensorFlow.js:', {
    error: error.message,
    stack: error.stack
  });
}

// Monitoramento de memória com logs em amarelo (warning)
setInterval(() => {
  const usage = process.memoryUsage();
  logger.warn('\x1b[33m%s\x1b[0m', 'Uso de Memória do Servidor:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)}MB`
  });
}, 300000);

// Global error handler com logs em vermelho
app.use((err, req, res, next) => {
  logger.error('\x1b[31m%s\x1b[0m', 'Erro no servidor:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestBody: req.body,
    requestQuery: req.query
  });

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server with error handling
try {
  app.listen(PORT, () => {
    logger.info('\x1b[32m%s\x1b[0m', `Servidor iniciado com sucesso`, {
      port: PORT,
      environment: process.env.NODE_ENV,
      cacheDir: path.join(__dirname, 'cache'),
      timestamp: new Date().toISOString()
    });
  });
} catch (error) {
  logger.error('\x1b[31m%s\x1b[0m', 'Erro fatal ao iniciar servidor:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
}
