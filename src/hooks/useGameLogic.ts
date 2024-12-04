import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameState } from './useGameState';
import { useGameActions } from './useGameActions';
import { useGameInitialization } from './useGameInitialization';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { performCrossValidation } from '@/utils/validation/crossValidation';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { handlePlayerPredictions } from '@/utils/prediction/predictionUtils';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { calculateReward, logReward } from '@/utils/rewardSystem';
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
    neuralNetworkVisualization,
    setNeuralNetworkVisualization,
    modelMetrics,
    setModelMetrics,
    dates,
    setDates,
    numbers,
    setNumbers,
    isInfiniteMode,
    boardNumbers,
    setBoardNumbers,
    concursoNumber,
    setConcursoNumber,
    gameCount,
    setGameCount,
    isManualMode,
    trainingData,
    setTrainingData
  } = gameState;

  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) return;

    const nextConcurso = (concursoNumber + 1) % csvData.length;
    setConcursoNumber(nextConcurso);
    setGameCount(prev => prev + 1);

    const currentBoardNumbers = csvData[nextConcurso];
    setBoardNumbers(currentBoardNumbers);
    
    const validationMetrics = performCrossValidation(
      [players[0].predictions],
      csvData.slice(Math.max(0, nextConcurso - 10), nextConcurso),
      10 // minSamples as number
    );

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

    let totalMatches = 0;
    let randomMatches = 0;
    let currentGameMatches = 0;
    let currentGameRandomMatches = 0;
    const totalPredictions = players.length * (nextConcurso + 1);

    const updatedPlayers = players.map((player, index) => {
      const predictions = playerPredictions[index];
      const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
      totalMatches += matches;
      currentGameMatches += matches;
      
      const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
      randomMatches += randomMatch;
      currentGameRandomMatches += randomMatch;

      temporalAccuracyTracker.recordAccuracy(matches);

      const reward = calculateReward(matches);
      
      if (matches >= 11) {
        const logMessage = logReward(matches, player.id);
        gameActions.addLog(logMessage);
        
        if (matches >= 13) {
          toast({
            title: "Desempenho Excepcional!",
            description: `Jogador ${player.id} acertou ${matches} números!`
          });
        }
      }

      return {
        ...player,
        score: player.score + reward,
        predictions,
        fitness: matches
      };
    });

    setModelMetrics({
      accuracy: totalMatches / (players.length * 15),
      randomAccuracy: randomMatches / (players.length * 15),
      totalPredictions: totalPredictions,
      perGameAccuracy: currentGameMatches / (players.length * 15),
      perGameRandomAccuracy: currentGameRandomMatches / (players.length * 15)
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
    neuralNetworkVisualization,
    modelMetrics,
    initializePlayers,
    gameLoop,
    evolveGeneration: gameActions.evolveGeneration,
    addLog: gameActions.addLog,
    toggleInfiniteMode: useCallback(() => {
      gameState.setIsInfiniteMode(prev => !prev);
    }, [gameState]),
    dates,
    numbers,
    isInfiniteMode,
    boardNumbers,
    concursoNumber,
    trainedModel,
    gameCount,
    isManualMode,
    toggleManualMode: gameActions.toggleManualMode,
    clonePlayer: gameActions.clonePlayer,
    champion
  };
};