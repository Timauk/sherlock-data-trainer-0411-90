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
      modelInputShape: trainedModel.inputs[0].shape
    });

    const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [new Date()])[0];
    
    systemLogger.log('prediction', 'Dados enriquecidos', {
      enrichedDataLength: enrichedData.length,
      expectedLength: 13072
    });

    if (enrichedData.length !== 13072) {
      throw new Error(`Tamanho dos dados enriquecidos incorreto. Esperado 13072, recebido ${enrichedData.length}`);
    }

    const predictions = await Promise.all(
      players.map(async (player) => {
        // Aplicar pesos individuais do jogador aos dados enriquecidos
        const weightedData = enrichedData.map((value, index) => {
          const weight = player.weights[index % player.weights.length];
          // Normalização do peso para evitar valores extremos
          const normalizedWeight = (weight / 1000) * 2; // Fator de escala ajustável
          return value * normalizedWeight;
        });

        const inputTensor = tf.tensor2d([weightedData]);
        
        systemLogger.log('prediction', `Previsão para jogador ${player.id}`, {
          weightsSample: player.weights.slice(0, 5),
          tensorShape: inputTensor.shape
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        // Converter previsões em números (1-25) com influência dos pesos
        const weightedPredictions = result.map((value, index) => ({
          value: value * (player.weights[index % player.weights.length] / 500),
          index: index + 1
        }));

        const finalPrediction = weightedPredictions
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(item => item.index)
          .sort((a, b) => a - b);

        systemLogger.log('prediction', `Previsão finalizada para jogador ${player.id}`, {
          prediction: finalPrediction,
          originalWeights: player.weights.slice(0, 5)
        });

        return finalPrediction;
      })
    );

    systemLogger.log('prediction', 'Previsões geradas com sucesso', {
      totalPredictions: predictions.length,
      samplePrediction: predictions[0]
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Falha ao gerar previsões', { 
      error,
      inputShape: currentBoardNumbers.length,
      modelInputShape: trainedModel.inputs[0].shape
    });
    throw error;
  }
};