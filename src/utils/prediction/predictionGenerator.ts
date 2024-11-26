import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { decisionTreeSystem } from '../../utils/learning/decisionTree.js';
import { tfDecisionTree } from '../learning/tfDecisionTree';
import { systemLogger } from '../logging/systemLogger';

interface PredictionResult {
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[] = []
): Promise<PredictionResult[]> => {
  const predictions: PredictionResult[] = [];
  const targets = [
    { matches: 11, count: 2 },
    { matches: 12, count: 2 },
    { matches: 13, count: 2 },
    { matches: 14, count: 1 },
    { matches: 15, count: 1 }
  ];

  const championFactors = {
    experience: champion.generation / 1000,
    performance: champion.score / 1000,
    consistency: champion.fitness / 15,
    adaptability: champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length
  };

  try {
    for (const target of targets) {
      for (let i = 0; i < target.count; i++) {
        const inputTensor = tf.tidy(() => {
          // Adiciona ruído aleatório aos inputs
          const randomNoise = Array(20).fill(0).map(() => Math.random() * 0.2 - 0.1);
          const normalizedInput = [
            ...lastConcursoNumbers.slice(0, 15).map(n => (n / 25) + (Math.random() * 0.1 - 0.05)),
            championFactors.experience + randomNoise[15],
            championFactors.performance + randomNoise[16],
            championFactors.consistency + randomNoise[17],
            championFactors.adaptability + randomNoise[18],
            Date.now() / (1000 * 60 * 60 * 24 * 365) + randomNoise[19]
          ];
          return tf.tensor2d([normalizedInput]);
        });

        const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
        const predictionArray = Array.from(await prediction.data());

        inputTensor.dispose();
        prediction.dispose();

        const selectedNumbers = tf.tidy(() => {
          // Adiciona variação aleatória aos pesos
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: (predictionArray[idx % predictionArray.length] + (Math.random() * 0.2 - 0.1)) * 
                    (1 + championFactors.consistency) * 
                    (target.matches / 15)
          }));

          // Garante números únicos com aleatoriedade
          const uniqueNumbers = new Set<number>();
          while (uniqueNumbers.size < 15) {
            const availableNumbers = weightedNumbers
              .filter(n => !uniqueNumbers.has(n.number))
              .sort((a, b) => (b.weight + Math.random() * 0.3) - (a.weight + Math.random() * 0.3));
            
            if (availableNumbers.length > 0) {
              uniqueNumbers.add(availableNumbers[0].number);
            }
          }

          return Array.from(uniqueNumbers).sort((a, b) => a - b);
        });

        const estimatedAccuracy = (target.matches / 15) * 100 * 
                                (1 + championFactors.performance * 0.1) *
                                (0.8 + Math.random() * 0.4); // Adiciona variação na precisão estimada

        const classicDecision = decisionTreeSystem.predict(selectedNumbers, 'Crescente');
        const tfDecision = await tfDecisionTree.predict(selectedNumbers, 'Crescente');
        const isGoodDecision = classicDecision && tfDecision;

        predictions.push({
          numbers: selectedNumbers,
          estimatedAccuracy: Math.min(estimatedAccuracy * (isGoodDecision ? 1.2 : 0.8), 100),
          targetMatches: target.matches,
          matchesWithSelected: selectedNumbers.filter(n => selectedNumbers.includes(n)).length,
          isGoodDecision
        });

        tfDecisionTree.addDecision(selectedNumbers, 'Crescente', isGoodDecision);
      }
    }

    tf.disposeVariables();
    
    return predictions;
  } catch (error) {
    systemLogger.log('system', `Erro ao gerar previsões: ${error}`);
    throw error;
  }
};