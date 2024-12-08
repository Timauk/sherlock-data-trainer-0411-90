import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameState } from './useGameState';
import { useGameActions } from './useGameActions';
import { useGameInitialization } from './useGameInitialization';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { validateGameState } from '@/utils/game/validation';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/game/lunarAnalysis';
import { handlePlayerPredictions } from '@/utils/game/playerPredictions';
import { updateModel } from '@/utils/game/modelUpdate';

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
    systemLogger.log('game', 'Iniciando inicialização do jogo', {
      hasCsvData: csvData?.length > 0,
      hasTrainedModel: !!trainedModel,
      timestamp: new Date().toISOString()
    });

    if (csvData && csvData.length > 0) {
      setNumbers([csvData[0]]);
      setBoardNumbers(csvData[0]);
      
      if (!players || players.length === 0) {
        try {
          const initialPlayers = initializePlayers();
          setPlayers(initialPlayers);
          
          const initialChampion = {
            player: initialPlayers[0],
            generation: 1,
            score: 0,
            trainingData: [] as number[][]
          };
          setChampion(initialChampion);
          
          systemLogger.log('game', 'Jogo inicializado com sucesso', {
            playersCount: initialPlayers.length,
            initialChampionId: initialChampion.player.id,
            firstNumbers: csvData[0]
          });
          
          return true;
        } catch (error) {
          systemLogger.error('game', 'Erro ao inicializar jogadores', { error });
          return false;
        }
      }
    }
    return false;
  }, [csvData, players, setNumbers, setBoardNumbers, setPlayers, setChampion, trainedModel]);

  const gameLoop = useCallback(async () => {
    if (!csvData.length || !trainedModel) {
      systemLogger.log('error', 'Missing required data for game loop', {
        hasCsvData: !!csvData.length,
        hasModel: !!trainedModel
      });
      return;
    }

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

    try {
      const playerPredictions = await handlePlayerPredictions(
        players,
        trainedModel,
        currentBoardNumbers,
        nextConcurso,
        setNeuralNetworkVisualization,
        { lunarPhase, lunarPatterns }
      );

      const updatedPlayers = players.map((player, index) => ({
        ...player,
        predictions: playerPredictions[index],
        score: player.score + (playerPredictions[index].filter(n => currentBoardNumbers.includes(n)).length)
      }));

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

      if (nextConcurso % Math.min(gameState.updateInterval, 50) === 0 && trainingData.length > 0) {
        await updateModel(trainedModel, trainingData, gameActions.addLog);
        setTrainingData([]);
      }

      // Changed from model.compiled to checking if model has been compiled
      const isModelCompiled = trainedModel.optimizer !== undefined;
      systemLogger.log('game', 'Game loop completed', {
        nextConcurso,
        playersUpdated: updatedPlayers.length,
        modelStatus: isModelCompiled ? 'compiled' : 'not compiled'
      });

    } catch (error) {
      systemLogger.error('game', 'Error in game loop', { error });
      toast({
        title: "Erro no Loop do Jogo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
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
    setNumbers, // Add this line to expose setNumbers
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