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
    
    // Ensure base directories exist
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const modelPath = path.join(baseModelDir, `full-model-${Date.now()}`);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(modelPath, { recursive: true });

    // Save model topology and weights
    try {
      await model.save(`file://${modelPath}`);
      logger.info(`Model saved to ${modelPath}`);
    } catch (modelError) {
      logger.error('Error saving model files:', modelError);
      throw new Error(`Failed to save model files: ${modelError.message}`);
    }

    // Save metadata with additional information
    const fullModelData = {
      totalSamples: global.totalSamples || 0,
      playersData,
      evolutionHistory,
      timestamp: new Date().toISOString(),
      modelConfig: model.getConfig(),
      modelSummary: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };

    // Save metadata file
    const metadataPath = path.join(modelPath, 'metadata.json');
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(fullModelData, null, 2)
    );
    logger.info(`Metadata saved to ${metadataPath}`);

    // Verify files were saved
    const savedFiles = fs.readdirSync(modelPath);
    if (savedFiles.length === 0) {
      throw new Error('No files were saved in the model directory');
    }

    logger.info({
      timestamp: fullModelData.timestamp,
      modelPath: modelPath,
      savedFiles: savedFiles
    }, 'Model and metadata saved successfully');
    
    res.json({
      success: true,
      savedAt: fullModelData.timestamp,
      totalSamples: fullModelData.totalSamples,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      },
      savedFiles: savedFiles,
      modelPath: modelPath
    });
  } catch (error) {
    logger.error('Error saving full model:', error);
    res.status(500).json({ 
      error: 'Failed to save model',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as storageRouter };