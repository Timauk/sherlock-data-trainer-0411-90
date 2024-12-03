import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';

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
    const model = await getOrCreateModel();
    
    if (!model) {
      logger.error('Falha ao inicializar modelo', {
        timestamp: new Date().toISOString()
      });
      throw new Error('Model could not be initialized');
    }

    logger.info('Modelo carregado com sucesso', {
      layers: model.layers.length,
      compiled: model.compiled,
      timestamp: new Date().toISOString()
    });

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      logger.warn('Nenhum padrão encontrado nos dados', {
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to analyze input data patterns');
    }

    logger.info('Padrões analisados', {
      patternsFound: patterns.length,
      patternTypes: patterns.map(p => p.type),
      timestamp: new Date().toISOString()
    });

    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    if (!enhancedInput) {
      logger.error('Falha ao enriquecer dados', {
        timestamp: new Date().toISOString()
      });
      throw new Error('Failed to enrich input data with patterns');
    }

    logger.info('Dados enriquecidos com sucesso', {
      inputLength: enhancedInput.length,
      timestamp: new Date().toISOString()
    });

    const tensor = tf.tensor2d([enhancedInput]);
    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    logger.info('Previsão gerada com sucesso', {
      predictionLength: result.length,
      predictionRange: {
        min: Math.min(...result),
        max: Math.max(...result)
      },
      timestamp: new Date().toISOString()
    });

    // Cleanup
    tensor.dispose();
    prediction.dispose();

    return {
      prediction: result,
      patterns,
      generation: generation + 1,
      modelMetrics: {
        layers: model.layers.length,
        totalParams: model.countParams()
      }
    };
  } catch (error) {
    logger.error('Erro na lógica do jogo', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}