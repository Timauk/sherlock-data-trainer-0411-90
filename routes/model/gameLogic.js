import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
import { enrichTrainingData } from '../../src/utils/features/lotteryFeatureEngineering.js';
import { calculateReward } from '../../src/utils/rewardSystem.js';
import { systemLogger } from '../../src/utils/logging/systemLogger.js';
import { extractFeatures } from '../../src/utils/features/featureEngineering.js';

const PLAYER_BASE_WEIGHTS = {
  aprendizadoBase: 509,
  adaptabilidade: 517,
  memoria: 985,
  intuicao: 341,
  precisao: 658,
  consistencia: 979,
  inovacao: 717,
  equilibrio: 453,
  foco: 117,
  resiliencia: 235,
  otimizacao: 371,
  cooperacao: 126,
  especializacao: 372,
  generalizacao: 50,
  evolucao: 668,
  estabilidade: 444,
  criatividade: 178
};

export async function processGameLogic(
  inputData,
  generation,
  playerWeights,
  isInfiniteMode,
  isManualMode
) {
  systemLogger.log('game', 'Iniciando processamento da lógica do jogo', {
    dataLength: inputData.length,
    generation,
    mode: { infinite: isInfiniteMode, manual: isManualMode },
    timestamp: new Date().toISOString()
  });

  try {
    await tf.setBackend('cpu');
    await tf.ready();

    const model = await getOrCreateModel();
    
    if (!model) {
      throw new Error('Model could not be initialized');
    }

    if (!inputData || !Array.isArray(inputData)) {
      throw new Error('Invalid input data');
    }

    const inputNumbers = inputData.slice(0, 15);
    
    // Enriquecer dados com as mesmas features do treinamento
    const currentDate = new Date();
    const historicalData = [inputNumbers];
    const features = extractFeatures(inputNumbers, currentDate, historicalData);
    
    // Combinar todas as features
    const enrichedInput = [
      ...features.baseFeatures,
      ...features.temporalFeatures,
      ...features.lunarFeatures,
      ...features.statisticalFeatures
    ];
    
    const tensor = tf.tensor2d([enrichedInput]);
    
    systemLogger.log('prediction', 'Gerando previsões com modelo', {
      inputShape: tensor.shape,
      modelLayers: model.layers.length,
      enrichedFeatures: enrichedInput.length,
      timestamp: new Date().toISOString()
    });

    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    systemLogger.log('prediction', 'Previsão gerada pelo modelo', {
      rawPrediction: result,
      timestamp: new Date().toISOString()
    });

    const playerResults = playerWeights.map((weights, index) => {
      const playerPredictions = result.slice(0, 15).map((num, i) => {
        const baseWeight = Object.values(PLAYER_BASE_WEIGHTS)[i] || 1;
        return Math.max(1, Math.min(25, Math.round(num * (baseWeight / 1000))));
      });
      
      const drawnNumbers = inputData.slice(0, 15);
      const matches = playerPredictions.filter(num => drawnNumbers.includes(num)).length;
      const score = calculateReward(matches);

      systemLogger.log('player', `Jogador #${index + 1} resultados detalhados:`, {
        predictions: playerPredictions,
        matches,
        drawnNumbers,
        score,
        baseWeights: PLAYER_BASE_WEIGHTS,
        modelVersion: model.modelVersion || 'latest',
        timestamp: new Date().toISOString()
      });

      const matchHistory = {
        concurso: generation,
        matches,
        score,
        predictions: playerPredictions,
        drawnNumbers,
        timestamp: new Date().toISOString()
      };

      return {
        playerId: index + 1,
        matches,
        predictions: playerPredictions,
        score,
        matchHistory,
        modelVersion: model.modelVersion || 'latest',
        weights: PLAYER_BASE_WEIGHTS
      };
    });

    tensor.dispose();
    prediction.dispose();

    return {
      prediction: result,
      patterns: analyzePatterns([inputData]),
      generation: generation + 1,
      playerResults,
      modelMetrics: {
        layers: model.layers.length,
        totalParams: model.countParams(),
        backend: tf.getBackend(),
        memoryInfo: tf.memory(),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    systemLogger.error('game', 'Erro na lógica do jogo', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}