import express from 'express';
import { trainingRouter } from './model/training.js';
import { predictionRouter } from './model/prediction.js';
import { storageRouter } from './model/storage.js';

const router = express.Router();

router.use('/', trainingRouter);
router.use('/', predictionRouter);
router.use('/', storageRouter);

export { router as modelRouter };