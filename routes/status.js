import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    version: '1.0.0'
  });
});

export { router as statusRouter };