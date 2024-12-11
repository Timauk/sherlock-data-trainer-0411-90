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
        // Aplicação dos pesos específicos para cada característica do jogador
        const weightedData = enrichedData.map((value, index) => {
          const weightIndex = index % player.weights.length;
          const playerWeight = player.weights[weightIndex];
          
          // Fatores de influência baseados nas características do jogador
          const learningFactor = (weightIndex === 0) ? playerWeight * 1.5 : 1;
          const adaptabilityFactor = (weightIndex === 1) ? playerWeight * 1.3 : 1;
          const memoryFactor = (weightIndex === 2) ? playerWeight * 1.4 : 1;
          const intuitionFactor = (weightIndex === 3) ? playerWeight * 1.6 : 1;
          
          // Bônus baseado no histórico do jogador
          const experienceBonus = (player.fitness / 15) + 0.5;
          const generationBonus = Math.log1p(player.generation) / 10;
          
          // Combinação dos fatores de peso
          const weightMultiplier = (
            learningFactor * 
            adaptabilityFactor * 
            memoryFactor * 
            intuitionFactor * 
            experienceBonus * 
            (1 + generationBonus)
          );
          
          return value * (playerWeight / 500) * weightMultiplier;
        });

        const inputTensor = tf.tensor2d([weightedData]);
        
        systemLogger.log('prediction', `Previsão para jogador ${player.id}`, {
          weightsSample: player.weights.slice(0, 5),
          fitness: player.fitness,
          generation: player.generation,
          tensorShape: inputTensor.shape
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        inputTensor.dispose();
        prediction.dispose();
        
        // Aplicação dos pesos na seleção final dos números
        const weightedPredictions = result.map((value, index) => {
          const weightIndex = index % player.weights.length;
          const weight = player.weights[weightIndex];
          
          // Influências específicas de cada peso
          const precisionInfluence = (weightIndex === 4) ? weight * 1.2 : 1;
          const consistencyInfluence = (weightIndex === 5) ? weight * 1.3 : 1;
          const innovationInfluence = (weightIndex === 6) ? weight * 1.4 : 1;
          const focusInfluence = (weightIndex === 8) ? weight * 1.5 : 1;
          
          // Bônus de evolução
          const scoreInfluence = player.score > 0 ? Math.log10(player.score) / 8 : 0;
          const evolutionBonus = player.weights[14] * 0.2; // Peso específico para evolução
          
          const finalWeight = (
            precisionInfluence * 
            consistencyInfluence * 
            innovationInfluence * 
            focusInfluence * 
            (1 + scoreInfluence) * 
            (1 + evolutionBonus)
          );
          
          return {
            value: value * finalWeight,
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