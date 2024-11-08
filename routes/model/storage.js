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
    fs.mkdirSync(modelDir);

    try {
      // Save model weights as buffer
      const weightData = await model.save(tf.io.withSaveHandler(async (artifacts) => {
        // Save model topology
        fs.writeFileSync(
          path.join(modelDir, 'model.json'),
          JSON.stringify(artifacts.modelTopology)
        );

        // Save weights
        const weightsBinary = Buffer.from(artifacts.weightData.buffer);
        fs.writeFileSync(
          path.join(modelDir, 'weights.bin'),
          weightsBinary
        );

        // Save weight specs
        fs.writeFileSync(
          path.join(modelDir, 'weight-specs.json'),
          JSON.stringify(artifacts.weightSpecs)
        );

        return { modelArtifactsInfo: { dateSaved: new Date() } };
      }));

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

      // Verify files exist
      const savedFiles = fs.readdirSync(modelDir);
      
      if (savedFiles.length === 0) {
        throw new Error('No files were created in the model directory');
      }

      logger.info('Model saved successfully. Files:', savedFiles);

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