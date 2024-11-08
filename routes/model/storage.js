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
      // Get model artifacts
      const artifacts = await model.save(tf.io.withSaveHandler(async (modelArtifacts) => {
        return modelArtifacts;
      }));

      // Save model topology
      logger.info('Saving model topology...');
      fs.writeFileSync(
        path.join(modelDir, 'model.json'),
        JSON.stringify(artifacts.modelTopology)
      );

      // Save weights as binary file
      logger.info('Saving weights binary...');
      const weightsData = Buffer.from(artifacts.weightData);
      fs.writeFileSync(
        path.join(modelDir, 'weights.bin'),
        weightsData
      );

      // Save weight specs
      logger.info('Saving weight specs...');
      fs.writeFileSync(
        path.join(modelDir, 'weight-specs.json'),
        JSON.stringify(artifacts.weightSpecs)
      );

      // Save metadata
      logger.info('Saving metadata...');
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

      // Verify files exist and have content
      const savedFiles = fs.readdirSync(modelDir);
      const filesWithSizes = savedFiles.map(file => ({
        name: file,
        size: fs.statSync(path.join(modelDir, file)).size
      }));
      
      logger.info('Files saved:', filesWithSizes);

      if (savedFiles.length === 0) {
        throw new Error('No files were created in the model directory');
      }

      // Verify each required file exists and has content
      const requiredFiles = ['model.json', 'weights.bin', 'weight-specs.json', 'metadata.json'];
      for (const file of requiredFiles) {
        const filePath = path.join(modelDir, file);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
          throw new Error(`File ${file} is missing or empty`);
        }
      }

      res.json({
        success: true,
        modelPath: modelDir,
        savedFiles: filesWithSizes,
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