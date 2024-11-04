import express from 'express';
import * as tf from '@tensorflow/tfjs';

const router = express.Router();
let globalModel = null;

async function getOrCreateModel() {
  if (!globalModel) {
    // Criando um modelo mais complexo com mais camadas e dropout
    globalModel = tf.sequential();
    
    // Primeira camada com batch normalization
    globalModel.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal'
    }));
    globalModel.add(tf.layers.batchNormalization());
    globalModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    // Segunda camada com skip connection
    globalModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal'
    }));
    globalModel.add(tf.layers.batchNormalization());
    globalModel.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Terceira camada
    globalModel.add(tf.layers.dense({ 
      units: 64, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal'
    }));
    globalModel.add(tf.layers.batchNormalization());
    
    // Camada de saída
    globalModel.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal'
    }));

    // Compilação com otimizador Adam melhorado
    globalModel.compile({ 
      optimizer: tf.train.adam(0.001, 0.9, 0.999, 1e-7),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'mse']
    });
  }
  return globalModel;
}

function calculateConfidence(predictions) {
  // Melhorando o cálculo de confiança com entropia
  const entropy = predictions.reduce((acc, pred) => {
    const p = Math.max(Math.min(pred, 1 - 1e-7), 1e-7);
    return acc - (p * Math.log2(p) + (1-p) * Math.log2(1-p));
  }, 0) / predictions.length;
  
  const certainty = predictions.reduce((acc, pred) => {
    const distance = Math.abs(pred - 0.5);
    return acc + (distance / 0.5);
  }, 0);
  
  return ((1 - entropy/1.5) * 50 + (certainty / predictions.length) * 50);
}

router.post('/train', async (req, res) => {
  try {
    const { trainingData } = req.body;
    const model = await getOrCreateModel();
    
    // Normalização e preparação dos dados
    const xs = tf.tensor2d(trainingData.map(d => d.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(d => d.slice(-15)));
    
    // Treinamento com early stopping
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
      valLoss: result.history.val_loss[result.history.val_loss.length - 1],
      valAccuracy: result.history.val_acc[result.history.val_acc.length - 1]
    });
    
    xs.dispose();
    ys.dispose();
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
    
    const confidence = calculateConfidence(result);
    
    inputTensor.dispose();
    prediction.dispose();
    
    res.json({ 
      prediction: result, 
      confidence,
      metadata: {
        modelArchitecture: model.summary(),
        inputShape: inputData.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as modelRouter };