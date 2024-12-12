import * as tf from '@tensorflow/tfjs';

let globalModel = null;
let totalSamples = 0;

export async function getOrCreateModel() {
  try {
    if (!globalModel) {
      globalModel = tf.sequential();
      
      // Input layer com shape correto para dados enriquecidos
      globalModel.add(tf.layers.dense({ 
        units: 256, 
        activation: 'relu', 
        inputShape: [13072],
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

      // Configuração explícita do otimizador
      const optimizer = tf.train.adam(0.001);
      
      // Compilação com configuração explícita
      globalModel.compile({ 
        optimizer: optimizer,
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Verificar status da compilação
      if (!globalModel.optimizer) {
        throw new Error('Falha na compilação do modelo');
      }

      console.log('Model compilation status:', {
        hasOptimizer: !!globalModel.optimizer,
        optimizerConfig: globalModel.optimizer.getConfig(),
        metrics: globalModel.metrics,
        loss: globalModel.loss
      });
    }
    
    return globalModel;
  } catch (error) {
    console.error('Error creating/getting model:', error);
    throw error;
  }
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