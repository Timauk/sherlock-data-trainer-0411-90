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

router.post('/save-full-model', async (req, res) => {
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
    
    // Get model weights and topology
    const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      // Create base directory if it doesn't exist
      const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
      if (!fs.existsSync(baseModelDir)) {
        fs.mkdirSync(baseModelDir, { recursive: true });
      }
      
      const modelPath = path.join(baseModelDir, 'full-model');
      if (!fs.existsSync(modelPath)) {
        fs.mkdirSync(modelPath, { recursive: true });
      }

      // Save model topology with weights manifest
      const modelJson = {
        modelTopology: artifacts.modelTopology,
        weightsManifest: [{
          paths: ['weights.bin'],
          weights: artifacts.weightSpecs
        }],
        format: 'layers-model',
        generatedBy: 'TensorFlow.js tfjs-layers v4.21.0',
        convertedBy: null
      };
      
      fs.writeFileSync(
        path.join(modelPath, 'model.json'),
        JSON.stringify(modelJson, null, 2)
      );
      
      // Save weights binary data
      fs.writeFileSync(
        path.join(modelPath, 'weights.bin'),
        Buffer.from(artifacts.weightData)
      );

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
        }
      };
    }));

    const fullModelData = {
      totalSamples: global.totalSamples || 0,
      playersData,
      evolutionHistory,
      timestamp: new Date().toISOString()
    };

    // Save metadata
    fs.writeFileSync(
      path.join(path.dirname(saveResult.modelArtifactsInfo.path), 'metadata.json'),
      JSON.stringify(fullModelData, null, 2)
    );

    logger.info({
      timestamp: fullModelData.timestamp,
      modelArtifacts: saveResult
    }, 'Model saved successfully');
    
    res.json({
      success: true,
      savedAt: fullModelData.timestamp,
      totalSamples: fullModelData.totalSamples,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    });
  } catch (error) {
    logger.error('Error saving full model:', error);
    res.status(500).json({ 
      error: 'Failed to save model',
      details: error.message
    });
  }
});

export { router as storageRouter };