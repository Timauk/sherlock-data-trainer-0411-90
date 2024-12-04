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
      modelConfig: trainedModel?.getConfig(),
      timestamp: new Date().toISOString()
    });

    if (csvData && csvData.length > 0) {
      setNumbers(csvData.slice(0, 1));
      setBoardNumbers(csvData[0]);
      
      if (!players || players.length === 0) {
        try {
          const initialPlayers: Player[] = initializePlayers();
          systemLogger.log('player', 'Jogadores inicializados', {
            count: initialPlayers.length,
            firstPlayer: initialPlayers[0],
            timestamp: new Date().toISOString()
          });

          setPlayers(initialPlayers);
          
          const initialChampion = {
            player: initialPlayers[0],
            generation: 1,
            score: 0,
            trainingData: [] as number[][]
          };
          setChampion(initialChampion);
        } catch (error) {
          systemLogger.log('error', 'Erro ao inicializar jogadores', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });
          toast({
            title: "Erro na Inicialização",
            description: "Falha ao inicializar jogadores. Verifique o console para mais detalhes.",
            variant: "destructive"
          });
        }
      }
    }
  }, [csvData, players, setNumbers, setBoardNumbers, setPlayers, setChampion, initializePlayers, toast]);

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

      const modelCompileStatus = trainedModel.compiled;
      systemLogger.log('game', 'Game loop completed', {
        nextConcurso,
        playersUpdated: updatedPlayers.length,
        modelStatus: modelCompileStatus ? 'compiled' : 'not compiled'
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
