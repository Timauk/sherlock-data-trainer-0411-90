import { Player, ModelVisualization } from '@/types/gameTypes';
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
    // Verificar estado do modelo
    if (!model || !model.compiled) {
      throw new Error('Modelo não compilado ou inválido');
    }

    systemLogger.log('model', '🔍 Estado do modelo:', {
      compiled: model.compiled,
      optimizer: model.optimizer ? '✅' : '❌',
      weights: model.getWeights().length,
      layers: model.layers.length
    });

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Falha ao enriquecer dados de entrada');
    }

    // Garantir formato correto com padding
    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    // Aplicar pesos do jogador
    const weightedData = paddedData.map((value, index) => 
      value * weights[index % weights.length]
    );

    const inputTensor = tf.tensor2d([weightedData]);
    
    systemLogger.log('prediction', '📊 Tensor de entrada:', {
      shape: inputTensor.shape,
      expectedShape: [1, 13072],
      weightsApplied: weights.slice(0, 5)
    });

    // Fazer previsão
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());

    systemLogger.log('prediction', '🎯 Previsões brutas:', {
      predictions: rawPredictions.slice(0, 5),
      min: Math.min(...rawPredictions),
      max: Math.max(...rawPredictions)
    });

    // Limpar memória
    inputTensor.dispose();
    predictions.dispose();

    // Converter previsões em números válidos (1-25)
    const numberPredictions = rawPredictions
      .map((prob, index) => ({
        number: index + 1,
        probability: prob
      }))
      .filter(p => p.number <= 25)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);

    systemLogger.log('prediction', '✨ Números selecionados:', {
      numbers: numberPredictions,
      total: numberPredictions.length,
      unique: new Set(numberPredictions).size
    });

    return numberPredictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na previsão:', { 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
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
  setNeuralNetworkVisualization: (viz: ModelVisualization) => void,
  lunarData: LunarData
) => {
  systemLogger.log('game', '🎮 Iniciando previsões:', {
    totalPlayers: players.length,
    concurso: nextConcurso,
    modelStatus: trainedModel ? 'loaded' : 'not loaded'
  });

  return Promise.all(
    players.map(async player => {
      try {
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights,
          { lunarPhase: lunarData.lunarPhase, patterns: lunarData.lunarPatterns }
        );

        // Registrar previsão para análise
        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        // Registrar resultado do jogador
        const matches = prediction.filter(num => currentBoardNumbers.includes(num)).length;
        systemLogger.log('player', `🎲 Jogador #${player.id}:`, {
          prediction,
          matches,
          accuracy: `${((matches / 15) * 100).toFixed(1)}%`
        });

        return prediction;
      } catch (error) {
        systemLogger.error('player', `Erro na previsão do Jogador #${player.id}:`, {
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        return [];
      }
    })
  );
};