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
        // Aplicação mais forte dos pesos individuais
        const weightedData = enrichedData.map((value, index) => {
          // Usa o peso específico do jogador de forma cíclica
          const playerWeight = player.weights[index % player.weights.length];
          
          // Normalização adaptativa baseada no fitness do jogador
          const fitnessBonus = (player.fitness / 15) + 0.5; // Bonus de 0.5 a 1.5 baseado no fitness
          
          // Aplica o peso com influência do fitness
          return value * (playerWeight / 500) * fitnessBonus;
        });

        const inputTensor = tf.tensor2d([weightedData]);
        
        systemLogger.log('prediction', `Previsão para jogador ${player.id}`, {
          weightsSample: player.weights.slice(0, 5),
          fitness: player.fitness,
          tensorShape: inputTensor.shape
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        // Aplicação dos pesos na seleção final dos números
        const weightedPredictions = result.map((value, index) => {
          const weight = player.weights[index % player.weights.length];
          const scoreInfluence = player.score > 0 ? Math.log10(player.score) / 10 : 0;
          const generationBonus = Math.log1p(player.generation) / 10;
          
          return {
            value: value * (1 + weight/1000) * (1 + scoreInfluence) * (1 + generationBonus),
            index: index + 1
          };
        });

        const finalPrediction = weightedPredictions
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(item => item.index)
          .sort((a, b) => a - b);

        systemLogger.log('prediction', `Previsão finalizada para jogador ${player.id}`, {
          prediction: finalPrediction,
          weights: player.weights.slice(0, 5),
          score: player.score,
          generation: player.generation,
          fitness: player.fitness
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