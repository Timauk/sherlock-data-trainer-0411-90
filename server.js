import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middlewares otimizados
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cacheMiddleware);

// Rotas
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);

// Rota principal
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    endpoints: {
      '/api/model': 'Gerenciamento do modelo de IA',
      '/api/checkpoint': 'Gerenciamento de checkpoints',
      '/api/status': 'Status do servidor'
    }
  });
});

// Rota para verificar se o servidor está online
app.get('/health', (req, res) => {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  logger.info(healthInfo, 'Health check');
  res.json(healthInfo);
});

// Middleware de erro
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

// Cria as pastas necessárias se não existirem
import fs from 'fs';
const checkpointsDir = path.join(__dirname, 'checkpoints');
const logsDir = path.join(__dirname, 'logs');
const savedModelsDir = path.join(__dirname, 'saved-models');

[checkpointsDir, logsDir, savedModelsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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