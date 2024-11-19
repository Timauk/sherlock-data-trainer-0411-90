import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../../src/utils/logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
let globalModel = null;
let totalSamples = 0;

async function getOrCreateModel() {
  if (!globalModel) {
    globalModel = tf.sequential();
    
    globalModel.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    globalModel.add(tf.layers.batchNormalization());
    globalModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    globalModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    globalModel.add(tf.layers.batchNormalization());
    
    globalModel.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    globalModel.compile({ 
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }
  return globalModel;
}

async function backupModel(model, totalGames) {
  try {
    const backupDir = path.join(__dirname, '../../model-backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelDir = path.join(backupDir, `model-${totalGames}-${timestamp}`);
    
    await model.save(`file://${modelDir}`);
    
    logger.info(`Model backup created at ${modelDir}`);
    return true;
  } catch (error) {
    logger.error('Error backing up model:', error);
    return false;
  }
}

router.post('/train', async (req, res) => {
  try {
    const { trainingData, playersKnowledge } = req.body;
    const model = await getOrCreateModel();
    
    totalSamples += trainingData.length;
    
    const combinedData = playersKnowledge ? [...trainingData, ...playersKnowledge] : trainingData;
    
    const patterns = analyzePatterns(combinedData);
    const enhancedData = enrichDataWithPatterns(combinedData, patterns);
    
    const xs = tf.tensor2d(enhancedData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(enhancedData.map(d => d.slice(-15)));
    
    const result = await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 5,
          restoreBestWeights: true
        })
      ]
    });
    
    res.json({
      loss: result.history.loss[result.history.loss.length - 1],
      accuracy: result.history.acc[result.history.acc.length - 1],
      totalSamples,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams(),
        combinedSamples: combinedData.length,
        patternsFound: patterns.length
      }
    });
    
    xs.dispose();
    ys.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/retrain', async (req, res) => {
  try {
    const { historicalData, totalGames } = req.body;
    const model = await getOrCreateModel();
    
    // Backup current model
    if (process.env.NODE_ENV !== 'development') {
      await backupModel(model, totalGames);
    }
    
    const patterns = analyzePatterns(historicalData);
    const enhancedData = enrichDataWithPatterns(historicalData, patterns);
    
    const xs = tf.tensor2d(enhancedData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(enhancedData.map(d => d.slice(-15)));
    
    const result = await model.fit(xs, ys, {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 5,
          restoreBestWeights: true
        })
      ]
    });
    
    res.json({
      success: true,
      loss: result.history.loss[result.history.loss.length - 1],
      accuracy: result.history.acc[result.history.acc.length - 1],
      totalSamples: historicalData.length,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    });
    
    xs.dispose();
    ys.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as trainingRouter };