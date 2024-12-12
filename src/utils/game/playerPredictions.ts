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
    systemLogger.log('prediction', 'Iniciando predição da rede neural', {
      inputDataLength: inputData.length,
      weightsLength: weights.length,
      sampleWeights: weights.slice(0, 5)
    });

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    // Preparar dados para a rede neural
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    // Aplicar pesos do jogador diretamente nos dados de entrada
    const weightedInput = paddedData.map((value, index) => 
      value * weights[index % weights.length]
    );

    // Fazer predição usando a rede neural
    const inputTensor = tf.tensor2d([weightedInput]);
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());

    systemLogger.log('prediction', 'Resultado da rede neural:', {
      rawLength: rawPredictions.length,
      samplePredictions: rawPredictions.slice(0, 5),
      weightsApplied: weights.slice(0, 5)
    });

    // Cleanup
    inputTensor.dispose();
    predictions.dispose();

    // Transformar as predições em números de 1 a 25
    const numberPredictions = Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      probability: rawPredictions[i % rawPredictions.length]
    }));

    // Selecionar os 15 números com maiores probabilidades
    const selectedNumbers = numberPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    systemLogger.log('prediction', 'Números selecionados pela rede:', {
      selectedNumbers,
      uniqueCount: new Set(selectedNumbers).size,
      weights: weights.slice(0, 5)
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
  systemLogger.log('prediction', 'Iniciando predições para todos jogadores:', {
    totalPlayers: players.length,
    currentBoardNumbers,
    nextConcurso
  });

  return Promise.all(
    players.map(async (player) => {
      const prediction = await makePrediction(
        trainedModel, 
        currentBoardNumbers, 
        player.weights,
        { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
      );

      const matches = prediction.filter(num => currentBoardNumbers.includes(num)).length;

      systemLogger.log('prediction', `Predição do Jogador #${player.id}:`, {
        prediction,
        matches,
        playerWeights: player.weights.slice(0, 5)
      });

      const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
      const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

      return prediction;
    })
  );
};