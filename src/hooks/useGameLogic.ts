import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameState } from './useGameState';
import { useGameActions } from './useGameActions';
import { useGameInitialization } from './useGameInitialization';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { validateGameState } from './useGameValidation';
import { updatePlayerStates } from './useGameStateUpdates';
import { handlePlayerPredictions } from '@/utils/prediction/predictionUtils';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { updateModel } from '@/utils/aiModel';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const { toast } = useToast();
  const gameState = useGameState();
  const gameActions = useGameActions(gameState);
  const { initializePlayers } = useGameInitialization();

  const {
    players,
    setPlayers,
    generation,
    champion,
    evolutionData,
    setEvolutionData,
    setNeuralNetworkVisualization,
    setModelMetrics,
    setDates,
    setNumbers,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    gameCount,
    setGameCount,
    trainingData,
    setTrainingData,
    setChampion
  } = gameState;

  const initializeGameData = useCallback(() => {
    if (csvData && csvData.length > 0) {
      setNumbers(csvData.slice(0, 1));
      setBoardNumbers(csvData[0]);
      
      if (!players || players.length === 0) {
        const initialPlayers = initializePlayers();
        setPlayers(() => [...initialPlayers]); // Fixed: Now correctly setting array of players
        
        const initialChampion = {
          player: initialPlayers[0],
          generation: 1,
          score: 0,
          trainingData: [] as number[][] // Fixed: Added required trainingData property with correct type
        };
        setChampion(() => initialChampion);
        
        systemLogger.log('game', 'Dados do jogo inicializados', {
          numbersLength: csvData.length,
          playersInitialized: initialPlayers.length,
          championId: initialChampion.player.id
        });
      }
    }
  }, [csvData, players, setNumbers, setBoardNumbers, setPlayers, setChampion, initializePlayers]);

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    const nextConcurso = (concursoNumber + 1) % csvData.length;
    setConcursoNumber(nextConcurso);
    setGameCount(prev => prev + 1);

    const currentBoardNumbers = csvData[nextConcurso];
    setBoardNumbers(currentBoardNumbers);
    
    validateGameState(players, csvData, nextConcurso);

    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);

    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      return newNumbers;
    });
    
    setDates(currentDates => [...currentDates, new Date()].slice(-100));

    const playerPredictions = await handlePlayerPredictions(
      players,
      trainedModel,
      currentBoardNumbers,
      nextConcurso,
      setNeuralNetworkVisualization,
      { lunarPhase, lunarPatterns }
    );

    const { updatedPlayers, metrics } = updatePlayerStates(
      players,
      playerPredictions,
      currentBoardNumbers,
      nextConcurso,
      gameActions.addLog,
      (title, description) => toast({ title, description })
    );

    setModelMetrics({
      accuracy: metrics.totalMatches / (players.length * 15),
      randomAccuracy: metrics.randomMatches / (players.length * 15),
      totalPredictions: metrics.totalPredictions,
      perGameAccuracy: metrics.currentGameMatches / (players.length * 15),
      perGameRandomAccuracy: metrics.currentGameRandomMatches / (players.length * 15)
    });

    setPlayers(updatedPlayers);
    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score,
        fitness: player.fitness
      }))
    ]);

    const enhancedTrainingData = [...currentBoardNumbers, 
      ...updatedPlayers[0].predictions,
      lunarPhase === 'Cheia' ? 1 : 0,
      lunarPhase === 'Nova' ? 1 : 0,
      lunarPhase === 'Crescente' ? 1 : 0,
      lunarPhase === 'Minguante' ? 1 : 0
    ];

    setTrainingData(currentTrainingData => 
      [...currentTrainingData, enhancedTrainingData]);

    if (nextConcurso % Math.min(gameState.updateInterval, 50) === 0 && trainingData.length > 0) {
      await updateModel(trainedModel, trainingData, { epochs: 5 });
      setTrainingData([]);
    }
  }, [
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    gameActions,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setBoardNumbers,
    setNeuralNetworkVisualization,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    toast,
    gameState.updateInterval
  ]);

  return {
    players,
    generation,
    evolutionData,
    initializePlayers,
    gameLoop,
    evolveGeneration: gameActions.evolveGeneration,
    addLog: gameActions.addLog,
    toggleInfiniteMode: useCallback(() => {
      gameState.setIsInfiniteMode(prev => !prev);
    }, [gameState]),
    dates: gameState.dates,
    numbers: gameState.numbers,
    isInfiniteMode: gameState.isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    isManualMode: gameState.isManualMode,
    toggleManualMode: gameActions.toggleManualMode,
    clonePlayer: gameActions.clonePlayer,
    champion,
    initializeGameData
  };
};
