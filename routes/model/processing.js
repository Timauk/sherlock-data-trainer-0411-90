import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';
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
  const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
  
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