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

async function validateModel(model: tf.LayersModel): Promise<boolean> {
  if (!model) return false;
  
  try {
    // Verificar se o modelo está compilado
    if (!model.optimizer) {
      systemLogger.error('model', 'Modelo não possui otimizador', {
        hasModel: true,
        hasOptimizer: false
      });
      return false;
    }

    // Verificar se as camadas estão inicializadas
    if (!model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Modelo não possui camadas', {
        hasLayers: false
      });
      return false;
    }

    return true;
  } catch (error) {
    systemLogger.error('model', 'Erro ao validar modelo', { error });
    return false;
  }
}

async function makePrediction(
  model: tf.LayersModel,
  inputData: number[],
  weights: number[],
  config: { lunarPhase: string; patterns: any }
): Promise<number[]> {
  try {
    // Validação do modelo
    const isModelValid = await validateModel(model);
    if (!isModelValid) {
      throw new Error('Modelo não compilado ou inválido');
    }

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
    
    systemLogger.log('prediction', 'Tensor de entrada criado:', {
      shape: inputTensor.shape,
      expectedShape: [1, 13072]
    });

    // Fazer previsão
    const predictions = model.predict(inputTensor) as tf.Tensor;
    const rawPredictions = Array.from(await predictions.data());
    
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

    systemLogger.log('prediction', 'Números selecionados:', {
      numbers: numberPredictions,
      total: numberPredictions.length
    });

    return numberPredictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na previsão:', { error });
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
  systemLogger.log('game', '🎮 Iniciando predições:', {
    totalPlayers: players.length,
    concurso: nextConcurso,
    modelLoaded: !!trainedModel,
    modelConfig: {
      layers: trainedModel.layers.length,
      hasWeights: trainedModel.getWeights().length > 0,
      optimizer: trainedModel.optimizer ? '✅' : '❌',
      inputDataShape: currentBoardNumbers.length,
      weightsLength: players[0]?.weights.length
    }
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