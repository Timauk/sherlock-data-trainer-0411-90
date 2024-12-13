import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../src/utils/logging/systemLogger';

let globalModel = null;
let totalSamples = 0;

export async function getOrCreateModel() {
  try {
    if (!globalModel) {
      systemLogger.log('model', 'Starting model creation', {
        backend: tf.getBackend(),
        memory: tf.memory()
      });

      // Create model with explicit architecture
      globalModel = tf.sequential();
      
      // Input layer with correct shape for enriched data
      globalModel.add(tf.layers.dense({ 
        units: 256, 
        activation: 'relu', 
        inputShape: [13072], // Updated to match expected shape
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

      // Explicit optimizer configuration
      const optimizer = tf.train.adam(0.001);
      
      // Compile with explicit configuration and metrics
      globalModel.compile({ 
        optimizer: optimizer,
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', 'mse']
      });

      // Verify model compilation
      const compilationStatus = validateModel(globalModel);
      if (!compilationStatus.isValid) {
        throw new Error(`Model compilation failed: ${compilationStatus.error}`);
      }

      // Test prediction with dummy data
      const testTensor = tf.zeros([1, 13072]); // Updated to match expected shape
      try {
        const testPred = globalModel.predict(testTensor);
        testPred.dispose();
        testTensor.dispose();
      } catch (error) {
        throw new Error(`Model prediction test failed: ${error.message}`);
      }

      systemLogger.log('model', 'Model created and compiled successfully', {
        layers: globalModel.layers.length,
        optimizer: globalModel.optimizer ? 'configured' : 'missing',
        metrics: globalModel.metrics,
        inputShape: globalModel.inputs[0].shape
      });
    }
    
    return globalModel;
  } catch (error) {
    systemLogger.error('model', 'Error creating/getting model:', { 
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

function validateModel(model) {
  if (!model) {
    return { isValid: false, error: 'Model not initialized' };
  }

  if (!model.layers || model.layers.length === 0) {
    return { isValid: false, error: 'Model has no layers' };
  }

  if (!model.optimizer) {
    return { isValid: false, error: 'Optimizer not configured' };
  }

  const inputShape = model.inputs[0].shape;
  if (!inputShape || inputShape[1] !== 13072) { // Updated to match expected shape
    return { 
      isValid: false, 
      error: `Invalid input shape: ${inputShape}. Expected: [null, 13072]` 
    };
  }

  const outputShape = model.outputs[0].shape;
  if (!outputShape || outputShape[1] !== 15) {
    return { 
      isValid: false, 
      error: `Invalid output shape: ${outputShape}. Expected: [null, 15]` 
    };
  }

  return { isValid: true };
}

export function analyzePatterns(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('Dados inválidos para análise de padrões');
    return [];
  }

  const patterns = [];
  
  for (const entry of data) {
    if (!entry || !Array.isArray(entry)) {
      console.warn('Entrada inválida encontrada durante análise');
      continue;
    }
    
    const numbers = entry.slice(0, 15);
    if (!numbers || numbers.length === 0) {
      console.warn('Números inválidos encontrados durante análise');
      continue;
    }
    
    for (let i = 0; i < numbers.length - 1; i++) {
      if (numbers[i + 1] - numbers[i] === 1) {
        patterns.push({
          type: 'consecutive',
          numbers: [numbers[i], numbers[i + 1]]
        });
      }
    }
    
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    patterns.push({
      type: 'evenOdd',
      evenPercentage: (evenCount / numbers.length) * 100
    });
    
    const primeCount = numbers.filter(isPrime).length;
    patterns.push({
      type: 'prime',
      primePercentage: (primeCount / numbers.length) * 100
    });
  }
  
  return patterns;
}

export function enrichDataWithPatterns(data, patterns) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('Dados inválidos para enriquecimento');
    return [];
  }

  if (!patterns || !Array.isArray(patterns)) {
    console.warn('Padrões inválidos para enriquecimento');
    return data;
  }

  return data.map(entry => {
    if (!entry || !Array.isArray(entry)) {
      console.warn('Entrada inválida encontrada durante enriquecimento');
      return entry;
    }

    // Enriquecer os dados com todas as features necessárias
    const enrichedData = enrichTrainingData([entry], [new Date()])[0];
    return enrichedData;
  });
}

function isPrime(num) {
  for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

export { totalSamples };