import express from 'express';
import * as tf from '@tensorflow/tfjs';

const router = express.Router();
let globalModel = null;
let totalSamples = 0;
const RETRAIN_INTERVAL = 1000; // Retreinar a cada 1000 previsões

async function getOrCreateModel() {
  if (!globalModel) {
    globalModel = tf.sequential();
    
    globalModel.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal'
    }));
    globalModel.add(tf.layers.batchNormalization());
    globalModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    globalModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal'
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

router.post('/train', async (req, res) => {
  try {
    const { trainingData, playersKnowledge } = req.body;
    const model = await getOrCreateModel();
    
    // Atualiza contador de amostras
    totalSamples += trainingData.length;
    
    // Combina dados de treinamento com conhecimento dos jogadores
    const combinedData = playersKnowledge ? [...trainingData, ...playersKnowledge] : trainingData;
    
    const xs = tf.tensor2d(combinedData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(combinedData.map(d => d.slice(-15)));
    
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
        combinedSamples: combinedData.length
      }
    });
    
    xs.dispose();
    ys.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/save-full-model', async (req, res) => {
  try {
    const { playersData, evolutionHistory } = req.body;
    const model = await getOrCreateModel();
    
    // Salva o modelo com todo o conhecimento acumulado
    const modelArtifacts = await model.save('file://./saved-models/full-model');
    
    // Salva os dados complementares
    const fullModelData = {
      modelArtifacts,
      totalSamples,
      playersData,
      evolutionHistory,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      savedAt: fullModelData.timestamp,
      totalSamples,
      modelInfo: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { inputData } = req.body;
    const model = await getOrCreateModel();
    
    const inputTensor = tf.tensor2d([inputData]);
    const prediction = model.predict(inputTensor);
    const result = Array.from(await prediction.data());
    
    // Verifica se é hora de retreinar
    if (totalSamples > 0 && totalSamples % RETRAIN_INTERVAL === 0) {
      // Sinaliza que é necessário retreinamento
      res.json({ 
        prediction: result,
        needsRetraining: true,
        totalSamples,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        }
      });
    } else {
      res.json({ 
        prediction: result,
        totalSamples,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        }
      });
    }
    
    inputTensor.dispose();
    prediction.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as modelRouter };
