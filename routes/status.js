import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const healthInfo = {
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      version: '1.0.0'
    };
    res.json(healthInfo);
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

export { router as statusRouter };