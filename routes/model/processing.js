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

    // Validação mais rigorosa dos dados
    if (!inputData || !Array.isArray(inputData)) {
      logger.error('Invalid or missing input data');
      return res.status(400).json({ 
        error: 'Input data is required and must be an array' 
      });
    }

    if (!playerWeights || !Array.isArray(playerWeights)) {
      logger.error('Invalid or missing player weights');
      return res.status(400).json({ 
        error: 'Player weights are required and must be an array' 
      });
    }

    if (typeof generation !== 'number') {
      logger.error('Invalid generation value');
      return res.status(400).json({
        error: 'Generation must be a number'
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
    const model = await getOrCreateModel();
    
    if (!model) {
      throw new Error('Model could not be initialized');
    }

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      throw new Error('Failed to analyze input data patterns');
    }

    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    if (!enhancedInput) {
      throw new Error('Failed to enrich input data with patterns');
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
    logger.error('Error in game processing:', error);
    throw error;
  }
}

export { router as processingRouter };