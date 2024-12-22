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

// CORS configuration with improved error handling
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://lovable.dev',
      'https://dcc838c0-148c-47bb-abaf-cbdd03ce84f5.lovableproject.com',
      'https://id-preview--dcc838c0-148c-47bb-abaf-cbdd03ce84f5.lovable.app',
      '.lovableproject.com', // Allow all subdomains
      '.lovable.app' // Allow all subdomains
    ];
    
    // Debug logging
    logger.info('\x1b[33m%s\x1b[0m', 'CORS Request from origin:', { origin });
    
    if (!origin) {
      logger.info('\x1b[33m%s\x1b[0m', 'Allowing request with no origin');
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.startsWith('.')) {
        // Handle wildcard subdomains
        return origin.endsWith(allowed);
      }
      return origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      logger.info('\x1b[32m%s\x1b[0m', 'Origin allowed:', { origin });
      return callback(null, true);
    }
    
    logger.warn('\x1b[31m%s\x1b[0m', 'Origin rejected:', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Pre-flight requests
app.options('*', cors(corsOptions));

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
      logger.info('\x1b[32m%s\x1b[0m', `Directory exists: ${dir}`);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      logger.info('\x1b[32m%s\x1b[0m', `Directory created: ${dir}`);
    }
  })
);

// Apply routes
import { modelRouter } from './routes/model.js';
import { checkpointRouter } from './routes/checkpoint.js';
import { statusRouter } from './routes/status.js';
import { processingRouter } from './routes/model/processing.js';

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

// WebSocket error handling
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  logger.error('\x1b[31m%s\x1b[0m', 'Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server with error handling
try {
  const server = app.listen(PORT, () => {
    logger.info('\x1b[32m%s\x1b[0m', `Server started successfully`, {
      port: PORT,
      environment: process.env.NODE_ENV,
      cacheDir: path.join(__dirname, 'cache'),
      timestamp: new Date().toISOString()
    });
  });

  // WebSocket error handling
  server.on('upgrade', (request, socket, head) => {
    socket.on('error', (err) => {
      logger.error('\x1b[31m%s\x1b[0m', 'WebSocket error:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    });
  });

} catch (error) {
  logger.error('\x1b[31m%s\x1b[0m', 'Fatal error starting server:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  process.exit(1);
}
