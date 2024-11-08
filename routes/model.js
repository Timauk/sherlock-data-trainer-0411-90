import express from 'express';
import { trainingRouter } from './model/training.js';
import { predictionRouter } from './model/prediction.js';
import { storageRouter } from './model/storage.js';

const router = express.Router();

// Mount all model-related routes
router.use('/training', trainingRouter);
router.use('/prediction', predictionRouter);
router.use('/', storageRouter); // This ensures /api/model/save-full-model works

export { router as modelRouter };