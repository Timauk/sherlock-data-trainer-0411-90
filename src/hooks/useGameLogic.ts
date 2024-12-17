import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useGamePlayers } from './game/useGamePlayers';
import { useBankSystem } from './game/useBankSystem';
import { useGameEvolution } from './game/useGameEvolution';
import { useGameState } from './game/useGameState';
import { handlePlayerPredictions, updateModel } from '@/utils/predictions/predictionUtils';
import { validateGameState } from '@/utils/game/validation';
import { systemLogger } from '@/utils/logging/systemLogger';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/game/lunarAnalysis';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const {
    players,
    champion,
    setPlayers,
    initializePlayers,
    updatePlayers
  } = useGamePlayers();

  const {
    boardNumbers,
    concursoNumber,
    numbers,
    dates,
    setNumbers,
    setBoardNumbers,
    setConcursoNumber,
    setDates,
    updateBank
  } = useBankSystem();

  const {
    generation,
    evolutionData,
    setEvolutionData,
    evolveGeneration
  } = useGameEvolution();

  const gameState = useGameState();

  const initializeGameData = useCallback(() => {
    systemLogger.log('game', 'Iniciando inicialização do jogo', {
      hasCsvData: csvData?.length > 0,
      hasTrainedModel: !!trainedModel
    });

    if (csvData && csvData.length > 0) {
      setNumbers([csvData[0]]);
      setBoardNumbers(csvData[0]);
      
      if (!players || players.length === 0) {
        initializePlayers(100);
        return true;
      }
    }
    return false;
  }, [csvData, players, setNumbers, setBoardNumbers, initializePlayers]);

  const gameLoop = useCallback(async () => {
    if (!csvData.length || !trainedModel) {
      systemLogger.log('error', 'Missing required data for game loop', {
        hasCsvData: !!csvData.length,
        hasModel: !!trainedModel
      });
      return;
    }

    const nextConcurso = (concursoNumber + 1) % csvData.length;
    const currentBoardNumbers = csvData[nextConcurso];
    
    updateBank(currentBoardNumbers, nextConcurso);
    gameState.setGameCount(prev => prev + 1);
    
    validateGameState(players, csvData, nextConcurso);

    try {
      const currentDate = new Date();
      const lunarPhase = getLunarPhase(currentDate);
      const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
      
      const playerPredictions = await handlePlayerPredictions(
        players,
        trainedModel,
        currentBoardNumbers,
        gameState.setNeuralNetworkVisualization,
        { 
          phase: lunarPhase,
          patterns: lunarPatterns
        }
      );

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        predictions: playerPredictions[index],
        score: player.score + (playerPredictions[index].filter(n => 
          currentBoardNumbers.includes(n)).length)
      }));

      updatePlayers(updatedPlayers, trainedModel);
      setEvolutionData(prev => [
        ...prev,
        ...updatedPlayers.map(player => ({
          generation,
          playerId: player.id,
          score: player.score,
          fitness: player.fitness
        }))
      ]);

      if (nextConcurso % 50 === 0 && gameState.trainingData.length > 0) {
        await updateModel(trainedModel, gameState.trainingData, (message: string) => {
          systemLogger.log('training', message);
        });
        gameState.setTrainingData([]);
      }

      systemLogger.log('game', 'Game loop completed', {
        nextConcurso,
        playersUpdated: updatedPlayers.length,
        modelStatus: trainedModel.optimizer ? 'compiled' : 'not compiled'
      });

    } catch (error) {
      systemLogger.error('game', 'Error in game loop', { error });
      throw error;
    }
  }, [
    players,
    csvData,
    trainedModel,
    concursoNumber,
    generation,
    gameState,
    updateBank,
    updatePlayers,
    setEvolutionData
  ]);

  return {
    players,
    champion,
    generation,
    evolutionData,
    initializePlayers,
    gameLoop,
    evolveGeneration,
    dates,
    numbers,
    setNumbers,
    isInfiniteMode: gameState.isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount: gameState.gameCount,
    isManualMode: gameState.isManualMode,
    toggleManualMode: useCallback(() => {
      gameState.setIsManualMode(prev => !prev);
    }, [gameState]),
    toggleInfiniteMode: useCallback(() => {
      gameState.setIsInfiniteMode(prev => !prev);
    }, [gameState]),
    initializeGameData
  };
};

