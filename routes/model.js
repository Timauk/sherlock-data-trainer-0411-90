import express from 'express';
import { trainingRouter } from './model/training.js';
import { predictionRouter } from './model/prediction.js';
import { storageRouter } from './model/storage.js';

const router = express.Router();

// Mount storage routes first to ensure they take precedence
router.use('/save-full-model', storageRouter);
router.use('/training', trainingRouter);
router.use('/prediction', predictionRouter);

export { router as modelRouter };