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

// Função auxiliar para garantir que o diretório existe
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
};

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
      championData,
      lastCloneGameCount,
      cycleCount,
      gameCount
    } = req.body;
    
    if (!playersData || !evolutionHistory) {
      logger.warn('Missing required data for saving model');
      return res.status(400).json({ 
        error: 'Missing required data',
        details: 'playersData and evolutionHistory are required'
      });
    }

    const model = await getOrCreateModel();
    
    // Garantir que o diretório base existe
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    ensureDirectoryExists(baseModelDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelPath = path.join(baseModelDir, `model-${timestamp}`);
    ensureDirectoryExists(modelPath);

    // Salvar estado completo com verificação de dados
    const completeState = {
      timestamp,
      totalSamples: global.totalSamples || 0,
      playersData: Array.isArray(playersData) ? playersData : [],
      evolutionHistory: Array.isArray(evolutionHistory) ? evolutionHistory : [],
      gameState: gameState || {},
      currentCycle: currentCycle || 0,
      generation: generation || 1,
      scores: scores || [],
      trainingData: Array.isArray(trainingData) ? trainingData : [],
      predictionsCache: predictionsCache || {},
      championData: championData || null,
      lastCloneGameCount: lastCloneGameCount || 0,
      cycleCount: cycleCount || 0,
      gameCount: gameCount || 0,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };

    // Salvar modelo com pesos
    await model.save(`file://${modelPath}`);
    
    // Salvar estado completo com backup
    const statePath = path.join(modelPath, 'complete_state.json');
    const backupPath = path.join(modelPath, 'complete_state.backup.json');
    
    // Primeiro salvar como backup
    fs.writeFileSync(backupPath, JSON.stringify(completeState, null, 2));
    // Depois mover para o arquivo principal
    fs.renameSync(backupPath, statePath);

    logger.info({
      modelPath,
      completeState,
    }, 'Complete game state saved successfully');
    
    res.json({
      success: true,
      savedAt: timestamp,
      modelPath,
      modelInfo: completeState.modelInfo
    });
  } catch (error) {
    logger.error('Error saving complete game state:', error);
    res.status(500).json({ 
      error: 'Failed to save game state',
      details: error.message
    });
  }
});

router.get('/load-latest-model', async (req, res) => {
  try {
    const baseModelDir = path.join(__dirname, '..', '..', 'saved-models');
    ensureDirectoryExists(baseModelDir);

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
    
    // Tentar carregar o estado completo
    let completeState;
    const statePath = path.join(latestModelPath, 'complete_state.json');
    const backupPath = path.join(latestModelPath, 'complete_state.backup.json');
    
    try {
      // Tentar carregar o arquivo principal primeiro
      completeState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (error) {
      // Se falhar, tentar carregar o backup
      logger.warn('Failed to load main state file, trying backup');
      completeState = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    }

    // Verificar integridade dos dados
    if (!completeState || !completeState.playersData || !completeState.evolutionHistory) {
      throw new Error('Corrupted state file');
    }

    // Carregar modelo
    const model = await tf.loadLayersModel(`file://${latestModelPath}/model.json`);
    
    // Verificar se o modelo foi carregado corretamente
    if (!model || !model.layers || model.layers.length === 0) {
      throw new Error('Failed to load model properly');
    }

    res.json({
      success: true,
      ...completeState,
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