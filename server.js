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

// Log initialization with more details
logger.info('\x1b[32m%s\x1b[0m', 'Starting server...', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  port: PORT,
  environment: process.env.NODE_ENV || 'development'
});

// CORS configuration with improved error handling and logging
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://lovable.dev',
      '.lovableproject.com',
      '.lovable.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.info('\x1b[33m%s\x1b[0m', 'Allowing request with no origin');
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.startsWith('.')) {
        // Remove port number from origin for domain matching
        const originWithoutPort = origin.replace(/:\d+$/, '');
        return originWithoutPort.includes(allowed);
      }
      return origin === allowed;
    });
    
    if (isAllowed) {
      logger.info('\x1b[32m%s\x1b[0m', 'Origin allowed:', { origin });
      return callback(null, true);
    }
    
    logger.warn('\x1b[31m%s\x1b[0m', 'Origin rejected:', { 
      origin,
      allowedOrigins,
      timestamp: new Date().toISOString()
    });
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
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  logger.info('\x1b[32m%s\x1b[0m', 'New request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    origin: req.get('origin'),
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static('public'));
app.use(cacheMiddleware);

// Create necessary directories
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

// Root route handler with improved response
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test route with enhanced error logging
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    origin: req.get('origin'),
    host: req.get('host')
  });
});

// Initialize TensorFlow.js with enhanced error handling
try {
  await tf.ready();
  logger.info('\x1b[32m%s\x1b[0m', 'TensorFlow.js initialized successfully', {
    backend: tf.getBackend(),
    memory: tf.memory(),
    timestamp: new Date().toISOString()
  });
} catch (error) {
  logger.error('\x1b[31m%s\x1b[0m', 'Error initializing TensorFlow.js:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

// Memory monitoring with enhanced logging
setInterval(() => {
  const usage = process.memoryUsage();
  logger.warn('\x1b[33m%s\x1b[0m', 'Server Memory Usage:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)}MB`,
    timestamp: new Date().toISOString()
  });
}, 300000);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    logger.error('\x1b[31m%s\x1b[0m', 'Authorization error:', {
      error: err.message,
      path: req.path,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  logger.error('\x1b[31m%s\x1b[0m', 'Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced error handling
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
