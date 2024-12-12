import { Player, ModelVisualization } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { CheckCircle2, XCircle } from 'lucide-react';

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
    // Log detalhado da estrutura do modelo
    systemLogger.log('model', '🔍 Verificando estrutura do modelo:', {
      layers: model.layers.map(l => ({
        name: l.name,
        config: l.getConfig(),
        outputShape: l.outputShape,
        specs: l.inputSpec
      })),
      hasWeights: model.getWeights().length > 0,
      optimizer: model.optimizer ? '✅' : '❌',
      inputDataShape: inputData.length,
      weightsLength: weights.length
    });

    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...inputData]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      systemLogger.error('prediction', '❌ Falha ao enriquecer dados', {
        inputData,
        enrichedData: enrichedData ? 'null' : 'undefined'
      });
      throw new Error('Failed to enrich input data');
    }

    systemLogger.log('prediction', '📊 Dados enriquecidos gerados:', {
      originalData: inputData,
      enrichedData: enrichedData[0],
      weightsApplied: weights.slice(0, 5)
    });

    const paddedData = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedData[i] = enrichedData[0][i];
    }

    const weightedInput = paddedData.map((value, index) => 
      value * weights[index % weights.length]
    );

    const inputTensor = tf.tensor2d([weightedInput]);
    
    systemLogger.log('model', '📐 Formato do tensor de entrada:', {
      shape: inputTensor.shape,
      expectedShape: [1, 13072],
      status: inputTensor.shape[1] === 13072 ? '✅' : '❌'
    });

    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());

    systemLogger.log('prediction', '🎯 Predições brutas:', {
      predictions: rawPredictions,
      min: Math.min(...rawPredictions),
      max: Math.max(...rawPredictions)
    });

    inputTensor.dispose();
    predictions.dispose();

    const numberPredictions = Array.from({ length: 25 }, (_, i) => ({
      number: i + 1,
      probability: rawPredictions[i % rawPredictions.length]
    }));

    const selectedNumbers = numberPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(item => item.number)
      .sort((a, b) => a - b);

    systemLogger.log('prediction', '✨ Números finais selecionados:', {
      numbers: selectedNumbers,
      uniqueCount: new Set(selectedNumbers).size,
      status: selectedNumbers.length === 15 ? '✅' : '❌'
    });

    return selectedNumbers;
  } catch (error) {
    systemLogger.error('prediction', '❌ Erro na predição:', { 
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
  setNeuralNetworkVisualization: (viz: ModelVisualization) => void,
  lunarData: LunarData
) => {
  systemLogger.log('game', '🎮 Iniciando rodada de predições:', {
    totalPlayers: players.length,
    concurso: nextConcurso,
    modelLoaded: !!trainedModel,
    modelConfig: trainedModel ? {
      layers: trainedModel.layers.length,
      inputSpecs: trainedModel.layers[0].inputSpec,
      outputShape: trainedModel.outputs[0].shape
    } : null,
    currentBoardNumbers
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

      systemLogger.log('player', `🎲 Resultado Jogador #${player.id}:`, {
        playerId: player.id,
        prediction,
        weights: player.weights.slice(0, 5),
        matches,
        accuracy: `${((matches / 15) * 100).toFixed(1)}%`,
        status: matches > 0 ? '✅' : '❌'
      });

      const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
      const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
      predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

      return prediction;
    })
  );
};