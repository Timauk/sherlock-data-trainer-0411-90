import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';

// Cross Validation
export const performCrossValidation = (
  predictions: number[][],
  historicalData: number[][],
  folds: number = 5
): number => {
  let totalAccuracy = 0;

  for (let i = 0; i < folds; i++) {
    const testStart = Math.floor((i / folds) * historicalData.length);
    const testEnd = Math.floor(((i + 1) / folds) * historicalData.length);
    
    const testSet = historicalData.slice(testStart, testEnd);
    const matches = testSet.reduce((acc, numbers, idx) => {
      if (!predictions[idx]) return acc;
      return acc + predictions[idx].filter(n => numbers.includes(n)).length;
    }, 0);
    
    totalAccuracy += matches / (testSet.length * 15);
  }

  return totalAccuracy / folds;
};

// Data Validation
export const validateInputData = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  
  return data.every(row => {
    if (!Array.isArray(row)) return false;
    if (row.length !== 15) return false;
    return row.every(num => 
      typeof num === 'number' && 
      Number.isInteger(num) && 
      num >= 1 && 
      num <= 25
    );
  });
};

// Game State Validation
export const validateGameState = (
  players: Player[],
  historicalData: number[][],
  currentIndex: number
): boolean => {
  if (!Array.isArray(players) || players.length === 0) {
    systemLogger.error('validation', 'Invalid players array');
    return false;
  }

  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    systemLogger.error('validation', 'Invalid historical data');
    return false;
  }

  if (currentIndex < 0 || currentIndex >= historicalData.length) {
    systemLogger.error('validation', 'Invalid current index');
    return false;
  }

  const validPlayers = players.every(player => {
    return (
      player.id &&
      Array.isArray(player.weights) &&
      player.weights.length > 0 &&
      typeof player.score === 'number' &&
      Array.isArray(player.predictions)
    );
  });

  if (!validPlayers) {
    systemLogger.error('validation', 'Invalid player structure detected');
    return false;
  }

  return true;
};

// System Validation
export const validateSystemRequirements = async (): Promise<boolean> => {
  try {
    // Verificar memória disponível
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      if (memoryUsage > 0.9) {
        systemLogger.error('validation', 'Memory usage too high');
        return false;
      }
    }

    // Verificar suporte a WebGL
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      systemLogger.error('validation', 'WebGL not supported');
      return false;
    }

    // Verificar Workers
    if (!window.Worker) {
      systemLogger.error('validation', 'Web Workers not supported');
      return false;
    }

    return true;
  } catch (error) {
    systemLogger.error('validation', 'Error validating system requirements', { error });
    return false;
  }
};