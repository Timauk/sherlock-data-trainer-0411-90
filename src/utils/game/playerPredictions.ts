import { Player } from '@/types/gameTypes';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
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
  systemLogger.log('prediction', 'Iniciando predição individual', {
    inputLength: inputData.length,
    weightsLength: weights.length,
    lunarPhase: config.lunarPhase,
    timestamp: new Date().toISOString()
  });

  try {
    // Criar tensor de entrada
    const inputTensor = tf.tensor2d([inputData]);
    
    // Fazer predição
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await predictions.data());
    
    // Aplicar pesos do jogador
    const weightedResult = result.map((value, index) => {
      const weight = weights[index % weights.length];
      return value * weight;
    });

    // Cleanup
    inputTensor.dispose();
    predictions.dispose();

    systemLogger.log('prediction', 'Predição concluída', {
      originalResult: result.slice(0, 5),
      weightedResult: weightedResult.slice(0, 5),
      weightsApplied: weights.slice(0, 5)
    });

    return weightedResult;
  } catch (error) {
    systemLogger.log('error', 'Erro na predição individual', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inputDataState: inputData.length,
      weightsState: weights.length
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
  systemLogger.log('prediction', 'Iniciando predições para todos jogadores', {
    playerCount: players.length,
    currentNumbers: currentBoardNumbers,
    concurso: nextConcurso
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

        // Análise temporal adicional
        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        
        // Registrar predição para monitoramento
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        systemLogger.log('prediction', `Predição finalizada para Jogador #${player.id}`, {
          prediction: prediction.slice(0, 5),
          weights: player.weights.slice(0, 5),
          fitness: player.fitness
        });

        return prediction;
      } catch (error) {
        systemLogger.log('error', `Erro na predição do Jogador #${player.id}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          playerState: {
            id: player.id,
            weights: player.weights.length,
            fitness: player.fitness
          }
        });
        throw error;
      }
    })
  );
};