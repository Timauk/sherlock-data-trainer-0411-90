import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Updated CORS configuration
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(compression());

// Cria as pastas necessárias se não existirem
const checkpointsDir = path.join(__dirname, 'checkpoints');
const logsDir = path.join(__dirname, 'logs');
const savedModelsDir = path.join(__dirname, 'saved-models');

[checkpointsDir, logsDir, savedModelsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Diretório criado: ${dir}`);
  }
});

// Configurar rota estática para saved-models
app.use('/saved-models', express.static(path.join(__dirname, 'saved-models')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cacheMiddleware);

// Rotas
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);

// Updated status route
app.get('/api/status', (req, res) => {
  try {
    const healthInfo = {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0'
    };
    res.json(healthInfo);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use((err, req, res, next) => {
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body
  }, 'Error occurred');
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Gerenciamento de memória
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000); // Limpa a cada 5 minutos

app.listen(PORT, () => {
  logger.info(`Servidor rodando em http://localhost:${PORT}`);
  logger.info(`Diretório de checkpoints: ${checkpointsDir}`);
  logger.info(`Diretório de logs: ${logsDir}`);
  logger.info(`Diretório de modelos salvos: ${savedModelsDir}`);
});
