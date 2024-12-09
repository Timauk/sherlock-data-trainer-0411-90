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
      inputShape: currentBoardNumbers.length,
      playersCount: players.length,
      modelInputShape: trainedModel.inputs[0].shape
    });

    const enrichedData = enrichTrainingData([[...currentBoardNumbers]], [new Date()])[0];
    
    systemLogger.log('prediction', 'Dados enriquecidos', {
      enrichedLength: enrichedData.length,
      expectedLength: 13072
    });

    const predictions = await Promise.all(
      players.map(async (player) => {
        const inputTensor = tf.tensor2d([enrichedData]);
        
        systemLogger.log('prediction', 'Tensor de entrada criado', {
          shape: inputTensor.shape,
          values: enrichedData.length
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        const finalPrediction = result
          .map((n, i) => ({ value: n, index: i + 1 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(item => item.index)
          .sort((a, b) => a - b);

        return finalPrediction;
      })
    );

    systemLogger.log('prediction', 'Previsões geradas com sucesso', {
      totalPredictions: predictions.length,
      samplePrediction: predictions[0]
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Falha ao gerar previsões', { error });
    throw error;
  }
};