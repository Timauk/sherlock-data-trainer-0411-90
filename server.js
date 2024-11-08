import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import NodeCache from 'node-cache';
import * as tf from '@tensorflow/tfjs';
import { logger } from './src/utils/logging/logger.js';
import { cacheMiddleware } from './src/utils/performance/serverCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Cache configuration
const gameCache = new NodeCache({ 
  stdTTL: 0, // Infinite TTL
  checkperiod: 0, // Disable periodic checks
  useClones: false
});

app.use(cors({
  origin: true, // Allow requests from any origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

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

// New endpoint to store game predictions
app.post('/api/game/store', (req, res) => {
  const { concurso, predictions, players } = req.body;
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
});

// Endpoint to retrieve all stored games
app.get('/api/game/all', (req, res) => {
  const games = gameCache.get('games') || [];
  res.json(games);
});

// Import routes
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';

// Mount routes
app.use('/api/model', modelRouter);
app.use('/api/checkpoint', checkpointRouter);
app.use('/api/status', statusRouter);

// Basic error handler
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

// Add OPTIONS handler for preflight requests
app.options('*', cors());

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  dirs.forEach(dir => logger.info(`Directory created/verified: ${dir}`));
});
