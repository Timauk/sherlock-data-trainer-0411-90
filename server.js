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
const DEFAULT_PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.get('/api/status', (req, res) => {
  try {
    const healthInfo = {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      directories: {
        checkpoints: fs.existsSync(checkpointsDir),
        logs: fs.existsSync(logsDir),
        savedModels: fs.existsSync(savedModelsDir)
      }
    };
    logger.info(healthInfo, 'Health check');
    res.json(healthInfo);
  } catch (error) {
    logger.error(error, 'Error in health check');
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

const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .once('listening', () => {
        logger.info(`Servidor rodando em http://localhost:${port}`);
        logger.info(`Diretório de checkpoints: ${checkpointsDir}`);
        logger.info(`Diretório de logs: ${logsDir}`);
        logger.info(`Diretório de modelos salvos: ${savedModelsDir}`);
        resolve(server);
      })
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Porta ${port} em uso, tentando próxima porta...`);
          server.close();
          resolve(startServer(port + 1));
        } else {
          reject(err);
        }
      });
  });
};

// Gerenciamento de memória
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000);

startServer(DEFAULT_PORT).catch(err => {
  logger.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
