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

// Configuração básica do Express
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(compression());

// Criação de diretórios
const dirs = {
  checkpoints: path.join(__dirname, 'checkpoints'),
  logs: path.join(__dirname, 'logs'),
  savedModels: path.join(__dirname, 'saved-models')
};

Object.entries(dirs).forEach(([key, dir]) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Diretório criado: ${dir}`);
  }
});

// Configuração de rotas estáticas
app.use('/saved-models', express.static(dirs.savedModels));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cacheMiddleware);

// Importação e uso das rotas
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';

app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);

// Rota de status
app.get('/api/status', (req, res) => {
  try {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      directories: Object.fromEntries(
        Object.entries(dirs).map(([key, dir]) => [key, fs.existsSync(dir)])
      )
    });
  } catch (error) {
    logger.error(error, 'Error in health check');
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error({ err, method: req.method, url: req.url, body: req.body }, 'Error occurred');
  res.status(500).json({ error: 'Erro interno do servidor', message: err.message });
});

// Função para tentar portas alternativas
const findAvailablePort = async (startPort) => {
  return new Promise((resolve) => {
    const server = app.listen(startPort)
      .on('listening', () => {
        const port = server.address().port;
        logger.info(`Servidor iniciado na porta ${port}`);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Porta ${startPort} em uso, tentando próxima porta...`);
          server.close();
          findAvailablePort(startPort + 1).then(resolve);
        } else {
          logger.error('Erro ao iniciar servidor:', err);
          process.exit(1);
        }
      });
  });
};

// Inicialização do servidor
const startServer = async () => {
  try {
    process.on('SIGTERM', () => {
      logger.info('Recebido sinal SIGTERM, encerrando...');
      process.exit(0);
    });

    const server = await findAvailablePort(DEFAULT_PORT);
    const port = server.address().port;
    
    logger.info(`Servidor rodando em http://localhost:${port}`);
    logger.info('Diretórios:', dirs);
    
    // Limpeza de memória periódica
    setInterval(() => {
      if (global.gc) global.gc();
    }, 300000);
    
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();