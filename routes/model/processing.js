import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';

const router = express.Router();

router.post('/process-game', async (req, res) => {
  logger.info('Nova requisição /process-game recebida', {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });

  try {
    const { 
      inputData,
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode 
    } = req.body;

    // Enhanced input validation with detailed logging
    if (!inputData) {
      logger.error('Dados de entrada ausentes', { body: req.body });
      return res.status(400).json({ 
        error: 'Input data is required',
        details: 'O campo inputData é obrigatório'
      });
    }

    if (!Array.isArray(inputData)) {
      logger.error('Dados de entrada inválidos', { 
        inputData,
        type: typeof inputData 
      });
      return res.status(400).json({ 
        error: 'Input data must be an array',
        details: 'inputData deve ser um array'
      });
    }

    if (!Array.isArray(playerWeights)) {
      logger.error('Pesos do jogador inválidos', { 
        playerWeights,
        type: typeof playerWeights 
      });
      return res.status(400).json({ 
        error: 'Player weights must be an array',
        details: 'playerWeights deve ser um array'
      });
    }

    if (typeof generation !== 'number') {
      logger.error('Geração inválida', { 
        generation,
        type: typeof generation 
      });
      return res.status(400).json({
        error: 'Generation must be a number',
        details: 'generation deve ser um número'
      });
    }

    logger.info('Validação de entrada concluída com sucesso', {
      inputDataLength: inputData.length,
      playerWeightsLength: playerWeights.length,
      generation,
      isInfiniteMode,
      isManualMode
    });

    // Process game logic with enhanced logging
    const result = await processGameLogic(
      inputData,
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode
    );

    logger.info('Processamento concluído com sucesso', { 
      resultSize: result.prediction.length,
      patternsFound: result.patterns.length,
      newGeneration: result.generation
    });

    res.json(result);
  } catch (error) {
    logger.error('Erro no processamento do jogo', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: 'Ocorreu um erro durante o processamento do jogo'
    });
  }
});

async function processGameLogic(
  inputData,
  generation,
  playerWeights,
  isInfiniteMode,
  isManualMode
) {
  logger.info('Iniciando processamento da lógica do jogo', {
    dataLength: inputData.length,
    generation,
    mode: { infinite: isInfiniteMode, manual: isManualMode }
  });

  try {
    const model = await getOrCreateModel();
    
    if (!model) {
      logger.error('Falha ao inicializar modelo');
      throw new Error('Model could not be initialized');
    }

    logger.info('Modelo carregado com sucesso', {
      layers: model.layers.length,
      compiled: model.compiled
    });

    const patterns = analyzePatterns([inputData]);
    
    if (!patterns || patterns.length === 0) {
      logger.warn('Nenhum padrão encontrado nos dados');
      throw new Error('Failed to analyze input data patterns');
    }

    logger.info('Padrões analisados', {
      patternsFound: patterns.length,
      patternTypes: patterns.map(p => p.type)
    });

    const enhancedInput = enrichDataWithPatterns([inputData], patterns)[0];
    
    if (!enhancedInput) {
      logger.error('Falha ao enriquecer dados');
      throw new Error('Failed to enrich input data with patterns');
    }

    logger.info('Dados enriquecidos com sucesso', {
      inputLength: enhancedInput.length
    });

    const tensor = tf.tensor2d([enhancedInput]);
    const prediction = await model.predict(tensor);
    const result = Array.from(await prediction.data());

    logger.info('Previsão gerada com sucesso', {
      predictionLength: result.length,
      predictionRange: {
        min: Math.min(...result),
        max: Math.max(...result)
      }
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
      stack: error.stack
    });
    throw error;
  }
}

export { router as processingRouter };