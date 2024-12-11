import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { ModelVisualization } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: ModelVisualization) => void,
  lunarData: { lunarPhase: string; lunarPatterns: Record<string, number[]> }
) => {
  try {
    systemLogger.log('prediction', 'Iniciando processo de predição', {
      playersCount: players.length,
      currentBoardNumbers,
      modelState: {
        hasOptimizer: trainedModel.optimizer !== null,
        layersCount: trainedModel.layers.length,
        inputShape: trainedModel.inputs[0].shape
      },
      timestamp: new Date().toISOString()
    });

    const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [new Date()])[0];
    
    systemLogger.log('prediction', 'Dados enriquecidos gerados', {
      enrichedDataLength: enrichedData.length,
      sampleData: enrichedData.slice(0, 5),
      timestamp: new Date().toISOString()
    });

    const predictions = await Promise.all(
      players.map(async (player) => {
        systemLogger.log('prediction', `Gerando predição para Jogador #${player.id}`, {
          weights: player.weights.slice(0, 5),
          fitness: player.fitness,
          timestamp: new Date().toISOString()
        });

        const inputTensor = tf.tensor2d([enrichedData]);
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());

        // Aplicar pesos do jogador com características específicas
        const weightedProbabilities = probabilities.map((prob, idx) => {
          const number = idx + 1;
          if (number > 25) return { number: 0, probability: 0 };

          const weight = player.weights[idx % player.weights.length];
          const experienceFactor = Math.log1p(player.generation) / 10;
          const fitnessFactor = player.fitness + 0.1;
          
          return {
            number,
            probability: prob * weight * (1 + experienceFactor) * fitnessFactor
          };
        }).filter(item => item.number > 0);

        const selectedNumbers = weightedProbabilities
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 15)
          .map(item => item.number)
          .sort((a, b) => a - b);

        const matches = selectedNumbers.filter(num => 
          currentBoardNumbers.includes(num)
        ).length;

        player.fitness = matches / 15;

        systemLogger.log('prediction', `Predição finalizada para Jogador #${player.id}`, {
          selectedNumbers,
          matches,
          fitness: player.fitness,
          probabilities: weightedProbabilities.slice(0, 5),
          timestamp: new Date().toISOString()
        });

        inputTensor.dispose();
        prediction.dispose();

        return selectedNumbers;
      })
    );

    systemLogger.log('prediction', 'Processo de predição concluído', {
      totalPredictions: predictions.length,
      memoryInfo: tf.memory(),
      timestamp: new Date().toISOString()
    });

    return predictions;

  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar predições', {
      error: error.message,
      stack: error instanceof Error ? error.stack : undefined,
      modelState: {
        hasOptimizer: trainedModel.optimizer !== null,
        layersCount: trainedModel.layers.length
      },
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};