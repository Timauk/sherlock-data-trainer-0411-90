import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';

const router = express.Router();
const RETRAIN_INTERVAL = 1000;

router.post('/predict', async (req, res) => {
  try {
    const { inputData } = req.body;
    
    // Validate input data
    if (!inputData || !Array.isArray(inputData)) {
      return res.status(400).json({ 
        error: "Input data must be provided as an array" 
      });
    }

    const model = await getOrCreateModel();
    if (!model) {
      return res.status(500).json({ 
        error: "Model not available" 
      });
    }
    
    const patterns = analyzePatterns([inputData]);
    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    const inputTensor = tf.tensor2d([enhancedInput]);
    const prediction = model.predict(inputTensor);
    const result = Array.from(await prediction.data());
    
    // Limit the size of patterns data
    const simplifiedPatterns = patterns.map(p => ({
      type: p.type,
      count: p.type === 'consecutive' ? p.numbers?.length || 0 : null,
      percentage: p.type === 'evenOdd' ? p.evenPercentage : 
                 p.type === 'prime' ? p.primePercentage : null
    }));

    // Create a simplified response object
    const response = {
      prediction: result,
      needsRetraining: totalSamples > 0 && totalSamples % RETRAIN_INTERVAL === 0,
      totalSamples,
      modelInfo: {
        layers: model.layers?.length || 0,
        totalParams: model.countParams()
      },
      patterns: simplifiedPatterns
    };

    res.json(response);
    
    inputTensor.dispose();
    prediction.dispose();
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ error: error.message });
  }
});

export { router as predictionRouter };