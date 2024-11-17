import * as tf from '@tensorflow/tfjs';

let globalModel = null;
let totalSamples = 0;

export async function getOrCreateModel() {
  if (!globalModel) {
    globalModel = tf.sequential();
    
    // First layer must specify inputShape
    globalModel.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0, l2: 0.01 }),
      useBias: true,
      biasInitializer: 'zeros'
    }));
    
    globalModel.add(tf.layers.batchNormalization({
      axis: -1,
      momentum: 0.99,
      epsilon: 0.001,
      center: true,
      scale: true
    }));
    globalModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    globalModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0, l2: 0.01 }),
      useBias: true,
      biasInitializer: 'zeros'
    }));
    globalModel.add(tf.layers.batchNormalization({
      axis: -1,
      momentum: 0.99,
      epsilon: 0.001,
      center: true,
      scale: true
    }));
    
    globalModel.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal',
      useBias: true,
      biasInitializer: 'zeros'
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
  const patterns = [];
  
  for (const entry of data) {
    const numbers = entry.slice(0, 15);
    
    // Limit pattern analysis to essential data
    const consecutiveCount = findConsecutiveNumbers(numbers);
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const primeCount = numbers.filter(isPrime).length;
    
    patterns.push({
      type: 'consecutive',
      count: consecutiveCount
    });
    
    patterns.push({
      type: 'evenOdd',
      evenPercentage: (evenCount / numbers.length) * 100
    });
    
    patterns.push({
      type: 'prime',
      primePercentage: (primeCount / numbers.length) * 100
    });
  }
  
  return patterns;
}

function findConsecutiveNumbers(numbers) {
  let count = 0;
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i + 1] - numbers[i] === 1) count++;
  }
  return count;
}

function isPrime(num) {
  for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++) {
    if (num % i === 0) return false;
  }
  return num > 1;
}

export function enrichDataWithPatterns(data, patterns) {
  return data.map(entry => {
    const patternFeatures = [
      patterns.filter(p => p.type === 'consecutive').length / patterns.length,
      patterns.find(p => p.type === 'evenOdd')?.evenPercentage / 100 || 0.5,
      patterns.find(p => p.type === 'prime')?.primePercentage / 100 || 0.5
    ];
    
    return [...entry, ...patternFeatures];
  });
}

export { totalSamples };
