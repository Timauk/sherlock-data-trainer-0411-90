import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { decisionTreeSystem } from '../learning/decisionTree.js';
import { TFDecisionTree } from '../learning/tfDecisionTree';
import { systemLogger } from '../logging/systemLogger';

const tfDecisionTreeInstance = new TFDecisionTree();

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

  // Fatores técnicos do campeão
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
          const normalizedInput = [
            ...lastConcursoNumbers.slice(0, 15).map(n => n / 25),
            championFactors.experience,
            championFactors.performance,
            championFactors.consistency,
            championFactors.adaptability,
            Date.now() / (1000 * 60 * 60 * 24 * 365)
          ];
          return tf.tensor2d([normalizedInput]);
        });

        const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
        const predictionArray = Array.from(await prediction.data());

        // Cleanup tensors
        inputTensor.dispose();
        prediction.dispose();

        const selectedNumbers = tf.tidy(() => {
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: predictionArray[idx % predictionArray.length] * 
                    (1 + championFactors.consistency) * 
                    (target.matches / 15)
          }));

          return weightedNumbers
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 15)
            .map(n => n.number)
            .sort((a, b) => a - b);
        });

        const estimatedAccuracy = (target.matches / 15) * 100 * 
                                (1 + championFactors.performance * 0.1);

        const classicDecision = decisionTreeSystem.predict(selectedNumbers, 'Crescente');
        const tfDecision = tfDecisionTreeInstance.predict(selectedNumbers);
        const isGoodDecision = classicDecision && tfDecision;

        predictions.push({
          numbers: selectedNumbers,
          estimatedAccuracy,
          targetMatches: target.matches,
          matchesWithSelected: selectedNumbers.filter(n => selectedNumbers.includes(n)).length,
          isGoodDecision
        });
      }
    }

    // Ensure all tensors are cleaned up
    tf.disposeVariables();
    
    return predictions;
  } catch (error) {
    systemLogger.log('system', `Erro ao gerar previsões: ${error}`);
    throw error;
  }
};