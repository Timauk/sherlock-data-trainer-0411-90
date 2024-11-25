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

    if (!inputData) {
      throw new Error('Input data is required');
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
  // Game processing logic here
  const model = await getOrCreateModel();
  const patterns = analyzePatterns([inputData]);
  
  if (!patterns || patterns.length === 0) {
    throw new Error('Failed to analyze patterns from input data');
  }

  const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
  
  if (!enhancedInput) {
    throw new Error('Failed to enhance input data with patterns');
  }

  const prediction = await model.predict(tf.tensor2d([enhancedInput]));
  const result = Array.from(await prediction.data());

  return {
    prediction: result,
    patterns,
    generation: generation + 1,
    modelMetrics: {
      layers: model.layers.length,
      totalParams: model.countParams()
    }
  };
}

export { router as processingRouter };