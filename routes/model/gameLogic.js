import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
import { processGameLogic } from './gameLogic.js';
import { enrichTrainingData } from '../../src/utils/features/lotteryFeatureEngineering.js';

export async function processGameLogic(
  inputData,
  generation,
  playerWeights,
  isInfiniteMode,
  isManualMode
) {
  logger.info('Iniciando processamento da lógica do jogo', {
    dataLength: inputData.length,
    generation,
    mode: { infinite: isInfiniteMode, manual: isManualMode },
    timestamp: new Date().toISOString()
  });

  try {
    // Tenta usar CPU se WebGL falhar
    try {
      await tf.setBackend('webgl');
    } catch (e) {
      logger.warn('WebGL falhou, usando CPU', { error: e.message });
      await tf.setBackend('cpu');
    }

    logger.info('Backend TensorFlow:', {
      backend: tf.getBackend(),
      memory: tf.memory()
    });

    const model = await getOrCreateModel();
    
    if (!model) {
      throw new Error('Model could not be initialized');
    }

    if (!inputData || !Array.isArray(inputData)) {
      throw new Error('Invalid input data');
    }

    const enrichedData = enrichTrainingData([[...inputData]], [new Date()]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Failed to enrich input data');
    }

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      throw new Error('Failed to analyze input data patterns');
    }

    // Garantir que o tensor tenha a forma correta [1, 13057]
    const paddedData = new Array(13057).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13057; i++) {
      paddedData[i] = enrichedData[0][i];
    }
    
    const tensor = tf.tensor2d([paddedData]);
    
    logger.info('Tensor criado:', {
      shape: tensor.shape,
      sampleData: paddedData.slice(0, 5)
    });

    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    // Calcular acertos para cada jogador
    const playerResults = playerWeights.map((weights, index) => {
      const playerPredictions = result.slice(0, 15);
      const matches = playerPredictions.filter(num => 
        inputData.includes(Math.round(num))
      ).length;

      logger.info(`Jogador #${index + 1} acertos:`, {
        predictions: playerPredictions,
        matches,
        inputNumbers: inputData
      });

      return {
        playerId: index + 1,
        matches,
        predictions: playerPredictions
      };
    });

    // Cleanup
    tensor.dispose();
    prediction.dispose();

    return {
      prediction: result,
      patterns,
      generation: generation + 1,
      playerResults,
      modelMetrics: {
        layers: model.layers.length,
        totalParams: model.countParams(),
        backend: tf.getBackend(),
        memoryInfo: tf.memory()
      }
    };
  } catch (error) {
    logger.error('Erro na lógica do jogo', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}