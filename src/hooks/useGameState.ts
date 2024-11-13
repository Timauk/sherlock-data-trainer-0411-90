import { useState } from 'react';
import { Player } from '@/types/gameTypes';

export const useGameState = () => {
  // Recupera o último concurso do localStorage, ou começa do 0
  const lastConcurso = parseInt(localStorage.getItem('lastConcurso') || '0');
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [gameCount, setGameCount] = useState(0);
  const [evolutionData, setEvolutionData] = useState<Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(lastConcurso);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [trainingData, setTrainingData] = useState<number[][]>([]);

  // Atualiza o localStorage quando o concursoNumber muda
  const updateConcursoNumber = (num: number) => {
    localStorage.setItem('lastConcurso', num.toString());
    setConcursoNumber(num);
  };

  return {
    players,
    setPlayers,
    generation,
    setGeneration,
    gameCount,
    setGameCount,
    evolutionData,
    setEvolutionData,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber: updateConcursoNumber,
    isInfiniteMode,
    setIsInfiniteMode,
    trainingData,
    setTrainingData,
  };
};