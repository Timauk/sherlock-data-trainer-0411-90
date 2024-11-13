import express from 'express';
import { trainingRouter } from './model/training.js';
import { predictionRouter } from './model/prediction.js';
import { storageRouter } from './model/storage.js';

const router = express.Router();

// Mount routes with explicit paths
router.use('/save-full-model', storageRouter);
router.use('/training', trainingRouter);
router.use('/prediction', predictionRouter);

// Add a test endpoint to verify routing
router.get('/test', (req, res) => {
  res.json({ status: 'Model router is working' });
});

export { router as modelRouter };