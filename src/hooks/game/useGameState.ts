import { useState } from 'react';
import { ModelVisualization } from '@/types/gameTypes';

export const useGameState = () => {
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = 
    useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });

  return {
    isInfiniteMode,
    setIsInfiniteMode,
    isManualMode,
    setIsManualMode,
    gameCount,
    setGameCount,
    trainingData,
    setTrainingData,
    neuralNetworkVisualization,
    setNeuralNetworkVisualization,
    modelMetrics,
    setModelMetrics
  };
};