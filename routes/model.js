import express from 'express';
import * as tf from '@tensorflow/tfjs';

const router = express.Router();
let globalModel = null;
let totalSamples = 0;
const RETRAIN_INTERVAL = 1000;

async function getOrCreateModel() {
  if (!globalModel) {
    globalModel = tf.sequential();
    
    // Melhorada a arquitetura da rede neural
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

router.post('/train', async (req, res) => {
  try {
    const { trainingData, playersKnowledge } = req.body;
    const model = await getOrCreateModel();
    
    totalSamples += trainingData.length;
    
    const combinedData = playersKnowledge ? [...trainingData, ...playersKnowledge] : trainingData;
    
    // Análise de padrões melhorada
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

router.post('/save-full-model', async (req, res) => {
  try {
    const { playersData, evolutionHistory } = req.body;
    const model = await getOrCreateModel();
    
    const modelPath = './saved-models/full-model';
    await model.save(`file://${modelPath}`);
    
    const fullModelData = {
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
    console.error('Erro ao salvar modelo completo:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/predict', async (req, res) => {
  try {
    const { inputData } = req.body;
    const model = await getOrCreateModel();
    
    // Análise de padrões para previsão
    const patterns = analyzePatterns([inputData]);
    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    const inputTensor = tf.tensor2d([enhancedInput]);
    const prediction = model.predict(inputTensor);
    const result = Array.from(await prediction.data());
    
    if (totalSamples > 0 && totalSamples % RETRAIN_INTERVAL === 0) {
      res.json({ 
        prediction: result,
        needsRetraining: true,
        totalSamples,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        },
        patterns: patterns
      });
    } else {
      res.json({ 
        prediction: result,
        totalSamples,
        modelInfo: {
          layers: model.layers.length,
          totalParams: model.countParams()
        },
        patterns: patterns
      });
    }
    
    inputTensor.dispose();
    prediction.dispose();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function analyzePatterns(data) {
  const patterns = [];
  
  // Análise de sequências
  for (const entry of data) {
    const numbers = entry.slice(0, 15);
    
    // Verifica números consecutivos
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i + 1] - numbers[i] === 1) {
        patterns.push({
          type: 'consecutive',
          numbers: [numbers[i], numbers[i + 1]]
        });
      }
    }
    
    // Verifica números pares/ímpares
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    patterns.push({
      type: 'evenOdd',
      evenPercentage: (evenCount / numbers.length) * 100
    });
    
    // Verifica números primos
    const primeCount = numbers.filter(isPrime).length;
    patterns.push({
      type: 'prime',
      primePercentage: (primeCount / numbers.length) * 100
    });
  }
  
  return patterns;
}

function enrichDataWithPatterns(data, patterns) {
  return data.map(entry => {
    const patternFeatures = [
      patterns.filter(p => p.type === 'consecutive').length / patterns.length,
      patterns.find(p => p.type === 'evenOdd')?.evenPercentage / 100 || 0.5,
      patterns.find(p => p.type === 'prime')?.primePercentage / 100 || 0.5
    ];
    
    return [...entry, ...patternFeatures];
  });
}

function isPrime(num) {
  for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

export { router as modelRouter };