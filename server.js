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
  logger.info(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Cache configuration
  const gameCache = new NodeCache({ 
    stdTTL: 0,
    checkperiod: 0,
    useClones: false
  });

  // Basic CORS configuration first
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
  }));

  // Then add specific CORS headers for all responses
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(compression());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cacheMiddleware);

  // Create necessary directories
  const dirs = ['checkpoints', 'logs', 'saved-models'].map(dir => 
    path.join(__dirname, dir)
  );

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Mount routes
  app.use('/status', statusRouter);
  
  // Game routes
  const gameRouter = express.Router();

  gameRouter.post('/store', async (req, res) => {
    try {
      const { concurso, predictions, players } = req.body;
      if (!concurso || !predictions || !players) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const currentGames = gameCache.get('games') || [];
      currentGames.push({
        concurso,
        predictions,
        players,
        timestamp: new Date().toISOString()
      });
      
      gameCache.set('games', currentGames);
      
      res.json({ 
        success: true, 
        gamesStored: currentGames.length 
      });
    } catch (error) {
      logger.error('Error storing game:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  gameRouter.get('/all', async (req, res) => {
    try {
      const games = gameCache.get('games') || [];
      res.json(games);
    } catch (error) {
      logger.error('Error retrieving games:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.use('/api/game', gameRouter);

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error({
      err,
      method: req.method,
      url: req.url,
      body: req.body
    }, 'Error occurred');
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  });

  app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} started and listening on port ${PORT}`);
  });
}