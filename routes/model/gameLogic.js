import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
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
    timestamp: new Date().toISOString(),
    playerWeights: playerWeights ? playerWeights.length : 0,
    weightsSample: playerWeights ? playerWeights.slice(0, 5) : []
  });

  try {
    logger.info('Verificando estado da rede neural', {
      timestamp: new Date().toISOString(),
      tfBackend: tf.getBackend(),
      tfReady: tf.engine().ready,
      memoryInfo: tf.memory()
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

    // Verificação dos dados de entrada
    if (!inputData || !Array.isArray(inputData)) {
      logger.error('Dados de entrada inválidos', {
        inputType: typeof inputData,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid input data');
    }

    // Enriquecimento dos dados antes da análise de padrões
    const enrichedData = enrichTrainingData([[...inputData]], [new Date()]);
    
    if (!enrichedData || !enrichedData[0]) {
      logger.error('Falha ao enriquecer dados', {
        timestamp: new Date().toISOString(),
        inputData: inputData.slice(0, 5),
        inputLength: inputData.length
      });
      throw new Error('Failed to enrich input data');
    }

    logger.info('Dados enriquecidos com sucesso', {
      originalLength: inputData.length,
      enrichedLength: enrichedData[0].length,
      sampleData: enrichedData[0].slice(0, 5),
      timestamp: new Date().toISOString()
    });

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      logger.warn('Nenhum padrão encontrado nos dados', {
        timestamp: new Date().toISOString(),
        inputData: inputData.slice(0, 5),
        inputLength: inputData.length
      });
      throw new Error('Failed to analyze input data patterns');
    }

    // Verificação do tensor e predição
    logger.info('Iniciando criação do tensor', {
      timestamp: new Date().toISOString(),
      shape: [1, enrichedData[0].length]
    });

    // Garantir que o tensor tenha a forma correta [1, 13057]
    const paddedData = new Array(13057).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13057; i++) {
      paddedData[i] = enrichedData[0][i];
    }
    
    const tensor = tf.tensor2d([paddedData]);
    
    logger.info('Tensor criado com sucesso', {
      shape: tensor.shape,
      timestamp: new Date().toISOString(),
      sampleData: paddedData.slice(0, 5)
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
      samplePrediction: result.slice(0, 5)
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