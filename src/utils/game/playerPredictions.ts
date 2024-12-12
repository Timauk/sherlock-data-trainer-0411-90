import { Player } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  try {
    systemLogger.log('prediction', 'Iniciando predição com dados:', {
      inputDataLength: inputData.length,
      weightsLength: weights.length,
      sampleWeights: weights.slice(0, 5)
    });

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    systemLogger.log('prediction', 'Dados enriquecidos:', {
      originalLength: inputData.length,
      enrichedLength: enrichedData[0].length,
      sampleEnriched: enrichedData[0].slice(0, 5)
    });

    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    const inputTensor = tf.tensor2d([paddedData]);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawResult = Array.from(await predictions.data());

    systemLogger.log('prediction', 'Resultado bruto do modelo:', {
      rawResultLength: rawResult.length,
      sampleRawResult: rawResult.slice(0, 5),
      min: Math.min(...rawResult),
      max: Math.max(...rawResult)
    });

    inputTensor.dispose();
    predictions.dispose();

    // Transformar os valores para números válidos (1-25)
    const weightedNumbers = Array.from({ length: 25 }, (_, index) => ({
      number: index + 1,
      weight: rawResult[index % rawResult.length] * weights[index % weights.length]
    }));

    // Ordenar por peso e selecionar os 15 maiores
    const selectedNumbers = weightedNumbers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    systemLogger.log('prediction', 'Números selecionados após aplicação de pesos:', {
      selectedNumbers,
      uniqueCount: new Set(selectedNumbers).size
    });

    return selectedNumbers;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na predição:', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export const handlePlayerPredictions = async (
  players: Player[],
  trainedModel: tf.LayersModel,
  currentBoardNumbers: number[],
  nextConcurso: number,
  setNeuralNetworkVisualization: (viz: any) => void,
  lunarData: LunarData
) => {
  systemLogger.log('prediction', 'Iniciando predições para jogadores:', {
    totalPlayers: players.length,
    currentBoardNumbers,
    nextConcurso
  });

  const predictions = await Promise.all(
    players.map(async (player) => {
      const prediction = await makePrediction(
        trainedModel, 
        currentBoardNumbers, 
        player.weights,
        { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
      );

      // Calcular acertos com números da banca
      const matches = prediction.filter(num => currentBoardNumbers.includes(num)).length;

      systemLogger.log('prediction', `Predição do Jogador #${player.id}:`, {
        prediction,
        matches,
        playerWeights: player.weights.slice(0, 5)
      });

      return prediction;
    })
  );

  return predictions;
};