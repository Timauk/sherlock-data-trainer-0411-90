import express from 'express';
import * as tf from '@tensorflow/tfjs';
import { analyzePatterns, enrichDataWithPatterns, getOrCreateModel } from './utils.js';
import { logger } from '../../src/utils/logging/logger.js';
import { validateInputData, validatePlayerWeights } from './validation.js';
import { processGameLogic } from './gameLogic.js';
import { enrichTrainingData } from '../../src/utils/features/lotteryFeatureEngineering.js';
import { systemLogger } from '../../src/utils/logging/systemLogger.js';

const router = express.Router();

router.post('/process-game', async (req, res) => {
  systemLogger.log('game', 'Nova requisição /process-game recebida', {
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

    systemLogger.log('game', 'Dados recebidos para processamento:', {
      hasInputData: !!inputData,
      inputDataLength: inputData?.length,
      generation,
      hasPlayerWeights: !!playerWeights,
      playerWeightsLength: playerWeights?.length,
      isInfiniteMode,
      isManualMode,
      timestamp: new Date().toISOString()
    });

    const validationError = validateInputData(inputData) || validatePlayerWeights(playerWeights);
    if (validationError) {
      systemLogger.error('validation', 'Erro de validação', {
        error: validationError,
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: validationError.message,
        details: validationError.details
      });
    }

    const enrichedData = enrichTrainingData([inputData], [new Date()]);
    systemLogger.log('features', 'Dados enriquecidos:', {
      originalLength: inputData.length,
      enrichedLength: enrichedData[0].length,
      timestamp: new Date().toISOString()
    });

    // Calcular acertos para cada jogador
    const result = await processGameLogic(
      enrichedData[0],
      generation,
      playerWeights,
      isInfiniteMode,
      isManualMode
    );

    // Log detalhado dos acertos
    systemLogger.log('prediction', 'Processamento concluído com sucesso', { 
      resultSize: result.prediction.length,
      patternsFound: result.patterns.length,
      newGeneration: result.generation,
      playerResults: result.players?.map(p => ({
        id: p.id,
        fitness: p.fitness,
        score: p.score,
        predictions: p.predictions,
        matches: p.matches
      })),
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    systemLogger.error('game', 'Erro no processamento do jogo', {
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