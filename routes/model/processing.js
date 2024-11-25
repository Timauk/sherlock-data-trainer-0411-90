import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';

const router = express.Router();

router.post('/process-game', async (req, res) => {
  try {
    const { 
      inputData,
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode 
    } = req.body;

    if (!inputData || !Array.isArray(inputData)) {
      logger.error('Dados de entrada inválidos ou ausentes');
      return res.status(400).json({ 
        error: 'Dados de entrada são obrigatórios e devem ser um array' 
      });
    }

    if (!playerWeights || !Array.isArray(playerWeights)) {
      logger.error('Pesos do jogador inválidos ou ausentes');
      return res.status(400).json({ 
        error: 'Pesos do jogador são obrigatórios e devem ser um array' 
      });
    }

    // Process game logic
    const result = await processGameLogic(
      inputData,
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode
    );

    res.json(result);
  } catch (error) {
    logger.error('Error processing game:', error);
    res.status(500).json({ error: error.message });
  }
});

async function processGameLogic(
  inputData,
  generation,
  playerWeights,
  isInfiniteMode,
  isManualMode
) {
  try {
    // Game processing logic here
    const model = await getOrCreateModel();
    
    if (!model) {
      throw new Error('Modelo não pôde ser inicializado');
    }

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      throw new Error('Falha ao analisar padrões dos dados de entrada');
    }

    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    if (!enhancedInput) {
      throw new Error('Falha ao enriquecer dados de entrada com padrões');
    }

    const tensor = tf.tensor2d([enhancedInput]);
    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    // Cleanup
    tensor.dispose();
    prediction.dispose();

    return {
      prediction: result,
      patterns,
      generation: generation + 1,
      modelMetrics: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };
  } catch (error) {
    logger.error('Erro no processamento do jogo:', error);
    throw error;
  }
}

export { router as processingRouter };