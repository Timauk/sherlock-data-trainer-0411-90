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
    systemLogger.log('prediction', 'Iniciando geração de previsões', {
      inputNumbers: currentBoardNumbers,
      playersCount: players.length,
      modelInputShape: trainedModel.inputs[0].shape,
      modelState: {
        isCompiled: trainedModel.optimizer !== null,
        optimizer: trainedModel.optimizer ? 'present' : 'missing'
      }
    });

    const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [new Date()])[0];
    
    systemLogger.log('prediction', 'Dados enriquecidos', {
      enrichedDataLength: enrichedData.length,
      expectedLength: 13072,
      sampleData: enrichedData.slice(0, 5)
    });

    const predictions = await Promise.all(
      players.map(async (player) => {
        const weightedData = enrichedData.map((value, index) => {
          const weightIndex = index % player.weights.length;
          const weight = player.weights[weightIndex];
          
          // Aplicação dos pesos específicos
          const learningFactor = weightIndex === 0 ? weight * 1.5 : 1;
          const adaptabilityFactor = weightIndex === 1 ? weight * 1.3 : 1;
          const memoryFactor = weightIndex === 2 ? weight * 1.4 : 1;
          const intuitionFactor = weightIndex === 3 ? weight * 1.6 : 1;
          
          const experienceBonus = (player.fitness / 15) + 0.5;
          const generationBonus = Math.log1p(player.generation) / 10;
          
          return value * weight * (
            learningFactor * 
            adaptabilityFactor * 
            memoryFactor * 
            intuitionFactor * 
            experienceBonus * 
            (1 + generationBonus)
          );
        });

        const inputTensor = tf.tensor2d([weightedData]);
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());

        // Converte probabilidades em números de 1 a 25
        const numbersWithProbabilities = probabilities.map((prob, index) => ({
          number: index + 1,
          probability: prob
        })).filter(item => item.number <= 25);

        // Seleciona os 15 números com maiores probabilidades
        const selectedNumbers = numbersWithProbabilities
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 15)
          .map(item => item.number)
          .sort((a, b) => a - b);

        systemLogger.log('prediction', `Predição final para jogador ${player.id}`, {
          selectedNumbers,
          weights: player.weights.slice(0, 5),
          fitness: player.fitness,
          generation: player.generation
        });

        inputTensor.dispose();
        prediction.dispose();

        return selectedNumbers;
      })
    );

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar predições', {
      error: error.message,
      stack: error instanceof Error ? error.stack : undefined,
      modelState: {
        isCompiled: trainedModel.optimizer !== null,
        optimizer: trainedModel.optimizer ? 'present' : 'missing'
      }
    });
    throw error;
  }
};