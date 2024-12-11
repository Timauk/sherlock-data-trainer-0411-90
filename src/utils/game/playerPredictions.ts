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
        compiled: trainedModel.compiled,
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
        // Log detalhado dos pesos do jogador
        systemLogger.log('prediction', `Processando jogador ${player.id}`, {
          weights: player.weights,
          fitness: player.fitness,
          generation: player.generation,
          score: player.score
        });

        // Aplicação dos pesos específicos para cada característica
        const weightedData = enrichedData.map((value, index) => {
          const weightIndex = index % player.weights.length;
          const weight = player.weights[weightIndex];
          
          // Fatores de influência baseados nas características
          const learningFactor = weightIndex === 0 ? weight * 1.5 : 1;
          const adaptabilityFactor = weightIndex === 1 ? weight * 1.3 : 1;
          const memoryFactor = weightIndex === 2 ? weight * 1.4 : 1;
          const intuitionFactor = weightIndex === 3 ? weight * 1.6 : 1;
          
          // Bônus baseado no histórico
          const experienceBonus = (player.fitness / 15) + 0.5;
          const generationBonus = Math.log1p(player.generation) / 10;
          
          const weightMultiplier = (
            learningFactor * 
            adaptabilityFactor * 
            memoryFactor * 
            intuitionFactor * 
            experienceBonus * 
            (1 + generationBonus)
          );
          
          return value * (weight / 500) * weightMultiplier;
        });

        const inputTensor = tf.tensor2d([weightedData]);
        
        // Log do tensor de entrada
        systemLogger.log('prediction', `Tensor de entrada para jogador ${player.id}`, {
          shape: inputTensor.shape,
          weightedDataSample: weightedData.slice(0, 5)
        });

        const prediction = trainedModel.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());

        // Log do resultado bruto da predição
        systemLogger.log('prediction', `Resultado bruto da predição para jogador ${player.id}`, {
          rawPrediction: result.slice(0, 5)
        });
        
        // Seleção dos números com base nos pesos e predições
        const weightedPredictions = result.map((value, index) => {
          const weightIndex = index % player.weights.length;
          const weight = player.weights[weightIndex];
          
          const precisionInfluence = weightIndex === 4 ? weight * 1.2 : 1;
          const consistencyInfluence = weightIndex === 5 ? weight * 1.3 : 1;
          const innovationInfluence = weightIndex === 6 ? weight * 1.4 : 1;
          const focusInfluence = weightIndex === 8 ? weight * 1.5 : 1;
          
          const scoreInfluence = player.score > 0 ? Math.log10(player.score) / 8 : 0;
          const evolutionBonus = player.weights[14] * 0.2;
          
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
            number: index + 1
          };
        });

        // Seleção dos 15 números com maiores pesos
        const selectedNumbers = weightedPredictions
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(item => item.number)
          .sort((a, b) => a - b);

        // Log da predição final
        systemLogger.log('prediction', `Predição final para jogador ${player.id}`, {
          selectedNumbers,
          originalWeights: player.weights.slice(0, 5),
          fitness: player.fitness,
          generation: player.generation
        });

        // Cleanup
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
        compiled: trainedModel.compiled,
        optimizer: trainedModel.optimizer ? 'present' : 'missing'
      }
    });
    throw error;
  }
};