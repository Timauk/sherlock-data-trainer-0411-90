import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadModelFromDirectory, findLatestModelDir } from './modelLoader.js';
import { saveModelToDirectory } from './modelSaver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET route for loading the model
router.get('/', async (req, res) => {
  try {
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const latestModelDir = findLatestModelDir(baseModelDir);
    
    logger.info(`Loading model from directory: ${latestModelDir}`);
    const { model, metadata } = await loadModelFromDirectory(latestModelDir);
    
    res.json({
      success: true,
      modelInfo: {
        timestamp: metadata.timestamp,
        layers: model.layers.length,
        totalParams: model.countParams(),
        metadata: metadata
      }
    });
  } catch (error) {
    logger.error('Error in load model route:', error);
    res.status(500).json({
      error: 'Failed to load model',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST route for saving model
router.post('/', async (req, res) => {
  try {
    const { playersData, evolutionHistory } = req.body;
    
    if (!playersData || !evolutionHistory) {
      logger.warn('Missing required data for saving model');
      return res.status(400).json({ 
        error: 'Missing required data',
        details: { missingPlayersData: !playersData, missingEvolutionHistory: !evolutionHistory }
      });
    }

    const model = await getOrCreateModel();
    if (!model) {
      throw new Error('Failed to get or create model');
    }

    const timestamp = Date.now();
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const modelDir = path.join(baseModelDir, `model-${timestamp}`);
    
    const { metadata, filesPath } = await saveModelToDirectory(
      model, 
      modelDir, 
      playersData, 
      evolutionHistory
    );

    res.json({
      success: true,
      modelPath: filesPath,
      timestamp: metadata.timestamp,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    });
  } catch (error) {
    logger.error('Error in save model route:', error);
    res.status(500).json({
      error: 'Failed to save model',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as storageRouter };