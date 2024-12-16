import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
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

    // Garantir que o tensor tenha a forma correta [1, 13057]
    const paddedData = new Array(13057).fill(0);
    for (let i = 0; i < inputData.length && i < 13057; i++) {
      paddedData[i] = inputData[i];
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
        inputData.slice(0, 15).includes(Math.round(num))
      ).length;

      logger.info(`Jogador #${index + 1} acertos:`, {
        predictions: playerPredictions,
        matches,
        inputNumbers: inputData.slice(0, 15)
      });

      return {
        playerId: index + 1,
        matches,
        predictions: playerPredictions,
        score: matches * 10 // Pontuação baseada nos acertos
      };
    });

    // Cleanup
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