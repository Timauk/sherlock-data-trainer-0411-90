import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import cluster from 'cluster';
import os from 'os';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';
import { statusRouter } from './routes/status.js';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`Primary ${process.pid} is running`);
  
  // Only fork workers if we're not in development
  if (process.env.NODE_ENV === 'production') {
    logger.info(`Starting ${numCPUs} workers...`);
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
      cluster.fork();
    });
  } else {
    // In development, just run a single instance
    cluster.fork();
  }
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const app = express();
  const PORT = process.env.PORT || 3001;

  const gameCache = new NodeCache({ 
    stdTTL: 0,
    checkperiod: 0,
    useClones: false
  });

  app.use(cors({
    origin: function(origin, callback) {
      if(!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://id-preview--dcc838c0-148c-47bb-abaf-cbdd03ce84f5.lovable.app'
      ];
      callback(null, true); // Temporarily allow all origins
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  }));

  app.options('*', cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(compression());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cacheMiddleware);

  // Create necessary directories
  ['checkpoints', 'logs', 'saved-models'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.use('/status', statusRouter);
  
  // Game routes
  const gameRouter = express.Router();

  gameRouter.post('/store', async (req, res) => {
    try {
      const { concurso, predictions, players } = req.body;
      if (!concurso || !predictions || !players) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }
      const currentGames = gameCache.get('games') || [];
      currentGames.push({ concurso, predictions, players, timestamp: new Date().toISOString() });
      gameCache.set('games', currentGames);
      res.json({ success: true, gamesStored: currentGames.length });
    } catch (error) {
      logger.error('Error storing game:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  gameRouter.get('/all', async (req, res) => {
    try {
      res.json(gameCache.get('games') || []);
    } catch (error) {
      logger.error('Error retrieving games:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use('/api/game', gameRouter);

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error({ err, method: req.method, url: req.url, body: req.body }, 'Error occurred');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  // Try to start the server with error handling
  const server = app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} started and listening on port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please use a different port or stop the existing server.`);
      process.exit(1);
    } else {
      logger.error('Server error:', err);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}