import * as tf from '@tensorflow/tfjs';

let globalModel = null;
let totalSamples = 0;

export async function getOrCreateModel() {
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

export function analyzePatterns(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const patterns = [];
  
  for (const entry of data) {
    if (!entry || !Array.isArray(entry)) continue;
    
    const numbers = entry.slice(0, 15);
    if (!numbers || numbers.length === 0) continue;
    
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
    return [];
  }

  return data.map(entry => {
    if (!entry || !Array.isArray(entry)) return entry;

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

export { totalSamples };