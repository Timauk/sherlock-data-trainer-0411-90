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

    // Enhanced input validation
    if (!inputData) {
      logger.error('Missing input data');
      return res.status(400).json({ 
        error: 'Input data is required' 
      });
    }

    if (!Array.isArray(inputData)) {
      logger.error('Input data must be an array');
      return res.status(400).json({ 
        error: 'Input data must be an array' 
      });
    }

    if (!Array.isArray(playerWeights)) {
      logger.error('Player weights must be an array');
      return res.status(400).json({ 
        error: 'Player weights must be an array' 
      });
    }

    if (typeof generation !== 'number') {
      logger.error('Generation must be a number');
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
    res.status(500).json({ 
      error: error.message || 'Internal server error'
    });
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