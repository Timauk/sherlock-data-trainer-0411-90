import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

export interface PredictionConfig {
  lunarPhase: string;
  patterns: any;
  lunarPatterns: any;
}

// Temporal accuracy tracking
export const temporalAccuracyTracker = {
  accuracyHistory: [] as { matches: number, total: number }[],
  
  recordAccuracy(matches: number, total: number) {
    this.accuracyHistory.push({ matches, total });
    if (this.accuracyHistory.length > 100) {
      this.accuracyHistory.shift();
    }
  },
  
  getAverageAccuracy() {
    if (this.accuracyHistory.length === 0) return 0;
    const sum = this.accuracyHistory.reduce((acc, curr) => acc + (curr.matches / curr.total), 0);
    return sum / this.accuracyHistory.length;
  }
};

// Feedback system
export const feedbackSystem = {
  getConfidenceCorrelation(): number {
    return 0.75;
  },
  
  getAccuracyTrend(): number[] {
    return [0.65, 0.70, 0.72, 0.75];
  }
};

// Direct prediction generation
export async function generateDirectPredictions(
  model: tf.LayersModel,
  lastConcursoNumbers: number[],
  count: number = 10
): Promise<number[][]> {
  try {
    const predictions: number[][] = [];
    
    for (let i = 0; i < count; i++) {
      const inputTensor = tf.tensor2d([lastConcursoNumbers]);
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());
      
      const numbers = new Set<number>();
      const sortedProbs = probabilities
        .map((prob, idx) => ({ prob, num: idx + 1 }))
        .sort((a, b) => b.prob - a.prob);
        
      for (const item of sortedProbs) {
        if (numbers.size < 15) {
          numbers.add(item.num);
        }
      }
      
      predictions.push(Array.from(numbers).sort((a, b) => a - b));
      
      inputTensor.dispose();
      prediction.dispose();
    }
    
    systemLogger.log('prediction', 'Previsões diretas geradas', {
      count: predictions.length,
      firstPrediction: predictions[0]
    });
    
    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar previsões diretas', { error });
    throw error;
  }
}

// Player prediction handling
export async function handlePlayerPredictions(
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  setNeuralNetworkVisualization: (viz: any) => void,
  config: PredictionConfig
): Promise<number[][]> {
  try {
    if (!trainedModel) {
      throw new Error('Modelo não carregado');
    }

    const inputShape = trainedModel.inputs[0].shape[1];

    return Promise.all(
      players.map(async player => {
        if (!player.weights || player.weights.length === 0) {
          throw new Error(`Jogador ${player.id} com pesos inválidos`);
        }

        const currentDate = new Date();
        const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [currentDate]);
        
        if (!enrichedData || !enrichedData[0]) {
          throw new Error('Falha ao enriquecer dados de entrada');
        }

        const paddedData = new Array(inputShape).fill(0);
        for (let i = 0; i < enrichedData[0].length && i < inputShape; i++) {
          paddedData[i] = enrichedData[0][i] * (player.weights[i] / 1000);
        }
        
        const inputTensor = tf.tensor2d([paddedData]);
        const weightedInput = tf.mul(inputTensor, tf.tensor2d([player.weights.slice(0, inputShape)]));
        const prediction = trainedModel.predict(weightedInput) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());
        
        inputTensor.dispose();
        weightedInput.dispose();
        prediction.dispose();

        const weightedScores = new Array(25).fill(0).map((_, index) => {
          const baseProb = probabilities[index % probabilities.length];
          const weight = player.weights[index % player.weights.length];
          const historicalFreq = currentBoardNumbers.filter(n => n === index + 1).length;
          
          return {
            number: index + 1,
            score: (baseProb * weight * (1 + historicalFreq)) / 1000
          };
        });

        weightedScores.sort((a, b) => b.score - a.score);
        const selectedNumbers = weightedScores.slice(0, 15).map(ws => ws.number);

        return selectedNumbers.sort((a, b) => a - b);
      })
    );
  } catch (error) {
    systemLogger.error('prediction', 'Error in player predictions', { error });
    throw error;
  }
}

// Model update functionality
export async function updateModel(
  model: tf.LayersModel,
  trainingData: number[][],
  onProgress: (message: string) => void
): Promise<void> {
  try {
    const xs = tf.tensor2d(trainingData.map(row => row.slice(0, -15)));
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1} complete:`, logs);
          onProgress(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    xs.dispose();
    ys.dispose();
  } catch (error) {
    systemLogger.error('model', 'Error updating model', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Prediction confidence calculation
export const calculatePredictionConfidence = (
  prediction: number[],
  champion: Player | null | undefined,
  historicalData?: number[][]
): number => {
  if (!champion || !historicalData?.length) return 0;
  
  const matchCount = historicalData.reduce((count, numbers) => {
    const matches = prediction.filter(num => numbers.includes(num)).length;
    return count + (matches >= 11 ? 1 : 0);
  }, 0);
  
  return (matchCount / historicalData.length) * 100;
};