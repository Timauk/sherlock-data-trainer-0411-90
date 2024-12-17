import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
import { enrichTrainingData } from '../../src/utils/features/lotteryFeatureEngineering.js';
import { calculateReward } from '../../src/utils/rewardSystem.js';

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
    // Forçar backend CPU
    await tf.setBackend('cpu');
    await tf.ready();

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

    // Preparar dados de entrada (apenas os 15 números)
    const inputNumbers = inputData.slice(0, 15);
    const tensor = tf.tensor2d([inputNumbers]);
    
    logger.info('Tensor criado:', {
      shape: tensor.shape,
      sampleData: inputNumbers
    });

    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    // Calculate hits for each player
    const playerResults = playerWeights.map((weights, index) => {
      const playerPredictions = result.slice(0, 15).map(num => 
        Math.max(1, Math.min(25, Math.round(num)))
      );
      
      const drawnNumbers = inputData.slice(0, 15);
      const matches = playerPredictions.filter(num => drawnNumbers.includes(num)).length;
      const score = calculateReward(matches);

      logger.info(`Jogador #${index + 1} acertos:`, {
        predictions: playerPredictions,
        matches,
        inputNumbers: drawnNumbers,
        score
      });

      const matchHistory = {
        concurso: generation,
        matches,
        score,
        predictions: playerPredictions,
        drawnNumbers
      };

      return {
        playerId: index + 1,
        matches,
        predictions: playerPredictions,
        score,
        matchHistory
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