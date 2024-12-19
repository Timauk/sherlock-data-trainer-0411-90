import { systemLogger } from '../../src/utils/logging/systemLogger.js';

export function validateInputData(inputData) {
  systemLogger.log('validation', 'Validando dados de entrada', {
    hasData: !!inputData,
    isArray: Array.isArray(inputData),
    length: inputData?.length,
    timestamp: new Date().toISOString()
  });

  if (!inputData) {
    return {
      message: 'Input data is required',
      details: 'O campo inputData é obrigatório'
    };
  }

  if (!Array.isArray(inputData)) {
    return {
      message: 'Input data must be an array',
      details: 'inputData deve ser um array'
    };
  }

  if (inputData.length === 0) {
    return {
      message: 'Input data cannot be empty',
      details: 'inputData não pode estar vazio'
    };
  }

  return null;
}

export function validatePlayerWeights(playerWeights) {
  systemLogger.log('validation', 'Validando pesos dos jogadores', {
    hasWeights: !!playerWeights,
    isArray: Array.isArray(playerWeights),
    length: playerWeights?.length,
    timestamp: new Date().toISOString()
  });

  if (!playerWeights) {
    return {
      message: 'Player weights are required',
      details: 'O campo playerWeights é obrigatório'
    };
  }

  if (!Array.isArray(playerWeights)) {
    return {
      message: 'Player weights must be an array',
      details: 'playerWeights deve ser um array'
    };
  }

  return null;
}