import { logger } from '../../src/utils/logging/logger.js';

export function validateInputData(inputData) {
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