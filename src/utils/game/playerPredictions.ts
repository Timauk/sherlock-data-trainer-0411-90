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
        // Criar tensor de entrada com os dados enriquecidos
        const inputTensor = tf.tensor2d([enrichedData]);
        
        // Fazer predição usando o modelo
        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const probabilities = Array.from(await prediction.data());

        // Aplicar os pesos do jogador nas probabilidades
        const weightedProbabilities = probabilities.map((prob, idx) => ({
          number: idx + 1,
          probability: prob * player.weights[idx % player.weights.length]
        }));

        // Ordenar por probabilidade e selecionar os 15 números mais prováveis
        const selectedNumbers = weightedProbabilities
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 15)
          .map(item => item.number)
          .sort((a, b) => a - b);

        // Calcular acertos
        const matches = selectedNumbers.filter(num => 
          currentBoardNumbers.includes(num)
        ).length;

        // Atualizar fitness do jogador baseado nos acertos
        player.fitness = matches / 15;

        systemLogger.log('prediction', `Predição final para jogador ${player.id}`, {
          selectedNumbers,
          matches,
          fitness: player.fitness,
          weights: player.weights.slice(0, 5)
        });

        // Limpar tensores
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