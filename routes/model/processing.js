import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
import { processGameLogic } from './gameLogic.js';
import { enrichTrainingData } from '../../src/utils/features/lotteryFeatureEngineering.js';

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

    // Log received data
    logger.info('Dados recebidos:', {
      hasInputData: !!inputData,
      inputDataLength: inputData?.length,
      generation,
      hasPlayerWeights: !!playerWeights,
      playerWeightsLength: playerWeights?.length,
      isInfiniteMode,
      isManualMode
    });

    // Enhanced input validation
    const validationError = validateInputData(inputData) || validatePlayerWeights(playerWeights);
    if (validationError) {
      logger.error('Erro de validação', {
        error: validationError,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: validationError.message,
        details: validationError.details
      });
    }

    // Enriquecer os dados antes do processamento
    const enrichedData = enrichTrainingData([inputData], [new Date()]);
    logger.info('Dados enriquecidos:', {
      originalLength: inputData.length,
      enrichedLength: enrichedData[0].length,
      timestamp: new Date().toISOString()
    });

    const result = await processGameLogic(
      enrichedData[0], // Usar dados enriquecidos
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode
    );

    logger.info('Processamento concluído com sucesso', { 
      resultSize: result.prediction.length,
      patternsFound: result.patterns.length,
      newGeneration: result.generation,
      timestamp: new Date().toISOString()
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

export { router as processingRouter };