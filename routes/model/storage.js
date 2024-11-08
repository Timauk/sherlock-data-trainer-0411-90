import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Handle POST request for saving the full model
router.post('/', async (req, res) => {
  try {
    const { playersData, evolutionHistory } = req.body;
    
    if (!playersData || !evolutionHistory) {
      logger.warn('Missing required data for saving model');
      return res.status(400).json({ 
        error: 'Missing required data',
        details: 'playersData and evolutionHistory are required'
      });
    }

    const model = await getOrCreateModel();
    if (!model) {
      throw new Error('Failed to get or create model');
    }

    // Create timestamped directory for this save
    const timestamp = Date.now();
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const modelDir = path.join(baseModelDir, `model-${timestamp}`);
    
    // Ensure directory exists
    if (!fs.existsSync(baseModelDir)) {
      fs.mkdirSync(baseModelDir, { recursive: true });
    }
    fs.mkdirSync(modelDir, { recursive: true });

    // Save model files
    try {
      // First, save model architecture
      const modelConfig = model.toJSON();
      fs.writeFileSync(
        path.join(modelDir, 'model-architecture.json'),
        JSON.stringify(modelConfig, null, 2)
      );
      logger.info('Model architecture saved');

      // Then save weights
      await model.save(`file://${modelDir}`);
      logger.info('Model weights saved');

      // Save metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        totalSamples: global.totalSamples || 0,
        playersData,
        evolutionHistory,
        modelSummary: {
          layers: model.layers.length,
          totalParams: model.countParams()
        }
      };

      fs.writeFileSync(
        path.join(modelDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      logger.info('Metadata saved');

      // Verify files exist
      const savedFiles = fs.readdirSync(modelDir);
      logger.info('Files saved:', savedFiles);

      if (savedFiles.length === 0) {
        throw new Error('No files were created in the model directory');
      }

      res.json({
        success: true,
        modelPath: modelDir,
        savedFiles,
        timestamp: metadata.timestamp,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        }
      });
    } catch (saveError) {
      logger.error('Error during save operation:', saveError);
      throw new Error(`Failed to save model files: ${saveError.message}`);
    }
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