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
  systemLogger.log('prediction', 'Iniciando geração de previsões', {
    championId: champion.id,
    modelLoaded: !!trainedModel,
    lastConcursoNumbers: lastConcursoNumbers.length,
    selectedNumbers: selectedNumbers.length,
    tfBackend: tf.getBackend(),
    modelStatus: trainedModel ? 'loaded' : 'not loaded',
    weightsLoaded: trainedModel?.weights.length > 0
  });

  const predictions: PredictionResult[] = [];
  const targets = [
    { matches: 11, count: 2 },
    { matches: 12, count: 2 },
    { matches: 13, count: 2 },
    { matches: 14, count: 1 },
    { matches: 15, count: 1 }
  ];

  try {
    // Verificação do estado do TensorFlow
    const memoryInfo = tf.memory();
    systemLogger.log('prediction', 'Estado do TensorFlow', {
      backend: tf.getBackend(),
      memory: memoryInfo,
      engineReady: tf.engine().ready
    });

    // Fatores técnicos do campeão
    const championFactors = {
      experience: champion.generation / 1000,
      performance: champion.score / 1000,
      consistency: champion.fitness / 15,
      adaptability: champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length
    };

    systemLogger.log('prediction', 'Fatores do campeão calculados', championFactors);

    for (const target of targets) {
      systemLogger.log('prediction', `Iniciando previsão para alvo ${target.matches}`, {
        targetMatches: target.matches,
        count: target.count,
        championId: champion.id,
        timestamp: new Date().toISOString()
      });

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

        systemLogger.log('prediction', 'Tensor de entrada criado', {
          shape: inputTensor.shape,
          iteration: i,
          target: target.matches
        });

        const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
        const predictionArray = Array.from(await prediction.data());

        systemLogger.log('prediction', 'Previsão bruta gerada', {
          predictionLength: predictionArray.length,
          sampleValues: predictionArray.slice(0, 5)
        });

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

        systemLogger.log('prediction', 'Números selecionados', {
          numbers: selectedNumbers,
          estimatedAccuracy,
          targetMatches: target.matches
        });

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

        systemLogger.log('prediction', 'Previsão finalizada', {
          predictionCount: predictions.length,
          lastPrediction: predictions[predictions.length - 1]
        });
      }

      systemLogger.log('prediction', 'Previsão finalizada para alvo', {
        target: target.matches,
        predictions: predictions.length,
        memoryInfo: tf.memory()
      });
    }

    // Cleanup
    tf.disposeVariables();
    
    systemLogger.log('prediction', 'Geração de previsões concluída com sucesso', {
      totalPredictions: predictions.length,
      championId: champion.id,
      memoryInfo: tf.memory(),
      modelState: {
        isCompiled: trainedModel ? true : false,
        layers: trainedModel?.layers.length
      }
    });

    return predictions;
  } catch (error) {
    systemLogger.log('error', 'Erro crítico na geração de previsões', {
      error: error.message,
      stack: error.stack,
      championState: {
        id: champion.id,
        generation: champion.generation,
        weights: champion.weights.length
      },
      modelState: {
        loaded: !!trainedModel,
        hasLayers: trainedModel?.layers.length > 0
      },
      tfState: {
        backend: tf.getBackend(),
        memory: tf.memory(),
        engineReady: tf.engine().ready
      }
    });
    throw error;
  }
};