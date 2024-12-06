import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns } from './utils.js';
import { decisionTreeSystem } from '../../src/utils/learning/decisionTree.js';
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
    
    // Primeira camada com regularização L2 mais suave
    globalModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    globalModel.add(tf.layers.batchNormalization());
    globalModel.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Segunda camada com menos unidades
    globalModel.add(tf.layers.dense({ 
      units: 64, 
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    globalModel.add(tf.layers.batchNormalization());
    
    // Camada de saída com sigmoid para probabilidades
    globalModel.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    // Otimizador com learning rate menor
    globalModel.compile({ 
      optimizer: tf.train.adam(0.0001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    logger.info('Modelo criado com nova arquitetura', {
      layers: globalModel.layers.length,
      parameters: globalModel.countParams()
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
    const { trainingData, playersKnowledge, lunarPhase } = req.body;
    const model = await getOrCreateModel();
    
    totalSamples += trainingData.length;
    
    const combinedData = playersKnowledge ? [...trainingData, ...playersKnowledge] : trainingData;
    
    // Adiciona dados à árvore de decisão
    if (playersKnowledge) {
      playersKnowledge.forEach(data => {
        const numbers = data.slice(0, 15);
        const matches = data.slice(-1)[0];
        decisionTreeSystem.addPlayerDecision(
          { id: 'knowledge' },
          numbers,
          matches,
          lunarPhase
        );
      });
    }
    
    const patterns = analyzePatterns(combinedData);
    const enhancedData = enrichDataWithPatterns(combinedData, patterns);
    
    // Normalização dos dados de entrada
    const xs = tf.tensor2d(enhancedData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(enhancedData.map(d => d.slice(-15)));
    
    // Treinamento com early stopping mais paciente
    const result = await model.fit(xs, ys, {
      epochs: 30,
      batchSize: 16,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 8,
          restoreBestWeights: true
        }),
        {
          onEpochEnd: (epoch, logs) => {
            logger.info(`Época ${epoch + 1} finalizada`, {
              loss: logs.loss,
              accuracy: logs.acc,
              val_loss: logs.val_loss,
              val_acc: logs.val_acc
            });
          }
        }
      ]
    });
    
    // Obtém insights da árvore de decisão
    const treeInsights = decisionTreeSystem.getInsights();
    
    res.json({
      loss: result.history.loss[result.history.loss.length - 1],
      accuracy: result.history.acc[result.history.acc.length - 1],
      totalSamples,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams(),
        combinedSamples: combinedData.length,
        patternsFound: patterns.length,
        treeInsights
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