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
    
    // Criar diretório base se não existir
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    if (!fs.existsSync(baseModelDir)) {
      fs.mkdirSync(baseModelDir, { recursive: true });
      logger.info(`Created directory: ${baseModelDir}`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelPath = path.join(baseModelDir, `model-${timestamp}`);
    
    if (!fs.existsSync(modelPath)) {
      fs.mkdirSync(modelPath, { recursive: true });
      logger.info(`Created model directory: ${modelPath}`);
    }

    // Salvar modelo com pesos
    const saveResult = await model.save(`file://${modelPath}`);
    
    // Salvar metadados
    const metadata = {
      timestamp,
      totalSamples: global.totalSamples || 0,
      playersData,
      evolutionHistory,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };

    fs.writeFileSync(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    logger.info({
      modelPath,
      metadata,
      saveResult
    }, 'Model saved successfully');
    
    res.json({
      success: true,
      savedAt: timestamp,
      modelPath,
      modelInfo: metadata.modelInfo
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