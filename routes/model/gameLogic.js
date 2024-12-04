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
    timestamp: new Date().toISOString(),
    playerWeights: playerWeights ? playerWeights.length : 0
  });

  try {
    // Verificação da rede neural
    logger.info('Verificando estado da rede neural', {
      timestamp: new Date().toISOString(),
      tfBackend: tf.getBackend(),
      tfReady: tf.engine().ready
    });

    const model = await getOrCreateModel();
    
    if (!model) {
      logger.error('Falha ao inicializar modelo', {
        timestamp: new Date().toISOString(),
        error: 'Modelo não pôde ser inicializado',
        backendState: tf.getBackend()
      });
      throw new Error('Model could not be initialized');
    }

    logger.info('Modelo carregado com sucesso', {
      layers: model.layers.length,
      compiled: model.compiled,
      timestamp: new Date().toISOString(),
      modelConfig: model.getConfig(),
      weightsLoaded: model.weights.length > 0
    });

    // Verificação dos dados de entrada
    if (!inputData || !Array.isArray(inputData)) {
      logger.error('Dados de entrada inválidos', {
        inputType: typeof inputData,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid input data');
    }

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      logger.warn('Nenhum padrão encontrado nos dados', {
        timestamp: new Date().toISOString(),
        inputData: inputData.slice(0, 5),
        inputLength: inputData.length
      });
      throw new Error('Failed to analyze input data patterns');
    }

    logger.info('Padrões analisados', {
      patternsFound: patterns.length,
      patternTypes: patterns.map(p => p.type),
      timestamp: new Date().toISOString(),
      firstPattern: patterns[0],
      inputDataState: inputData.length
    });

    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    if (!enhancedInput) {
      logger.error('Falha ao enriquecer dados', {
        timestamp: new Date().toISOString(),
        patterns: patterns.length,
        inputDataLength: inputData.length,
        lastError: tf.engine().lastError
      });
      throw new Error('Failed to enrich input data with patterns');
    }

    logger.info('Dados enriquecidos com sucesso', {
      inputLength: enhancedInput.length,
      timestamp: new Date().toISOString(),
      sampleData: enhancedInput.slice(0, 5),
      memoryInfo: tf.memory()
    });

    // Verificação do tensor e predição
    logger.info('Iniciando criação do tensor', {
      timestamp: new Date().toISOString(),
      shape: [1, enhancedInput.length]
    });

    const tensor = tf.tensor2d([enhancedInput]);
    
    logger.info('Tensor criado com sucesso', {
      shape: tensor.shape,
      timestamp: new Date().toISOString()
    });

    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    logger.info('Previsão gerada com sucesso', {
      predictionLength: result.length,
      predictionRange: {
        min: Math.min(...result),
        max: Math.max(...result)
      },
      timestamp: new Date().toISOString(),
      samplePrediction: result.slice(0, 5),
      memoryInfo: tf.memory()
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
        totalParams: model.countParams(),
        configuration: model.getConfig(),
        backend: tf.getBackend(),
        memoryInfo: tf.memory()
      }
    };
  } catch (error) {
    logger.error('Erro na lógica do jogo', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      inputDataState: {
        hasData: !!inputData,
        length: inputData?.length
      },
      generationState: generation,
      playerWeightsState: {
        hasWeights: !!playerWeights,
        length: playerWeights?.length
      },
      tfState: {
        backend: tf.getBackend(),
        memory: tf.memory(),
        lastError: tf.engine().lastError
      }
    });
    throw error;
  }
}