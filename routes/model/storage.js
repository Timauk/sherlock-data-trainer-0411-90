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
    const { 
      playersData, 
      evolutionHistory,
      gameState,
      currentCycle,
      generation,
      scores,
      trainingData,
      predictionsCache,
      championData
    } = req.body;
    
    if (!playersData || !evolutionHistory) {
      logger.warn('Missing required data for saving model');
      return res.status(400).json({ 
        error: 'Missing required data',
        details: 'playersData and evolutionHistory are required'
      });
    }

    const model = await getOrCreateModel();
    
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
    
    // Salvar estado completo do jogo
    const metadata = {
      timestamp,
      totalSamples: global.totalSamples || 0,
      playersData,
      evolutionHistory,
      gameState,
      currentCycle,
      generation,
      scores,
      trainingData,
      predictionsCache,
      championData,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };

    fs.writeFileSync(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Salvar dados adicionais em arquivos separados para melhor organização
    fs.writeFileSync(
      path.join(modelPath, 'game_state.json'),
      JSON.stringify(gameState, null, 2)
    );

    fs.writeFileSync(
      path.join(modelPath, 'training_data.json'),
      JSON.stringify(trainingData, null, 2)
    );

    logger.info({
      modelPath,
      metadata,
      saveResult
    }, 'Model and game state saved successfully');
    
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

router.get('/load-latest-model', async (req, res) => {
  try {
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    const models = fs.readdirSync(baseModelDir)
      .filter(dir => dir.startsWith('model-'))
      .sort()
      .reverse();

    if (models.length === 0) {
      return res.status(404).json({
        error: 'No saved models found'
      });
    }

    const latestModelPath = path.join(baseModelDir, models[0]);
    const metadata = JSON.parse(
      fs.readFileSync(path.join(latestModelPath, 'metadata.json'), 'utf8')
    );

    const gameState = JSON.parse(
      fs.readFileSync(path.join(latestModelPath, 'game_state.json'), 'utf8')
    );

    const trainingData = JSON.parse(
      fs.readFileSync(path.join(latestModelPath, 'training_data.json'), 'utf8')
    );

    const model = await tf.loadLayersModel(`file://${latestModelPath}/model.json`);

    res.json({
      success: true,
      metadata,
      gameState,
      trainingData,
      modelPath: latestModelPath
    });

  } catch (error) {
    logger.error('Error loading latest model:', error);
    res.status(500).json({
      error: 'Failed to load model',
      details: error.message
    });
  }
});

export { router as storageRouter };