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
    
    // Ensure the directory exists with absolute path
    const modelPath = path.join(__dirname, '..', '..', 'saved-models', 'full-model');
    fs.mkdirSync(path.dirname(modelPath), { recursive: true });
    
    // Save the model weights as a binary file
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => {
      const weightsData = Buffer.from(artifacts.weightData);
      
      // Save model topology
      fs.writeFileSync(
        path.join(modelPath, 'model.json'),
        JSON.stringify(artifacts.modelTopology)
      );
      
      // Save weights
      fs.writeFileSync(
        path.join(modelPath, 'weights.bin'),
        weightsData
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

    // Save additional metadata
    fs.writeFileSync(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(fullModelData, null, 2)
    );

    logger.info({
      path: modelPath,
      timestamp: fullModelData.timestamp,
      modelArtifacts
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