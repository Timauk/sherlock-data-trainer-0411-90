import { useState } from 'react';
import { Player, Champion, ModelVisualization } from '@/types/gameTypes';

export const useGameState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [champion, setChampion] = useState<Champion | null>(null);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);
  const [neuralNetworkVisualization, setNeuralNetworkVisualization] = useState<ModelVisualization | null>(null);
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0,
    randomAccuracy: 0,
    totalPredictions: 0,
    perGameAccuracy: 0,
    perGameRandomAccuracy: 0
  });
  const [dates, setDates] = useState<Date[]>([]);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [frequencyData, setFrequencyData] = useState<{ [key: string]: number[] }>({});
  const [updateInterval, setUpdateInterval] = useState(10);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [isManualMode, setIsManualMode] = useState(false);

  return {
    players,
    setPlayers,
    generation,
    setGeneration,
    gameCount,
    setGameCount,
    champion,
    setChampion,
    evolutionData,
    setEvolutionData,
    neuralNetworkVisualization,
    setNeuralNetworkVisualization,
    modelMetrics,
    setModelMetrics,
    dates,
    setDates,
    numbers,
    setNumbers,
    frequencyData,
    setFrequencyData,
    updateInterval,
    setUpdateInterval,
    isInfiniteMode,
    setIsInfiniteMode,
    concursoNumber,
    setConcursoNumber,
    trainingData,
    setTrainingData,
    boardNumbers,
    setBoardNumbers,
    isManualMode,
    setIsManualMode
  };
};