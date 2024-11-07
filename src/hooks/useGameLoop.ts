import { useCallback } from 'react';
import { makePrediction } from '@/utils/predictionUtils';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';
import { performCrossValidation } from '@/utils/validation/crossValidation';
import { TimeSeriesAnalysis } from '@/utils/analysis/timeSeriesAnalysis';
import { predictionMonitor } from '@/utils/monitoring/predictionMonitor';
import { processPredictions } from '@/utils/gameLoop/predictionProcessor';
import { GameLoopDependencies } from '@/utils/gameLoop/types';

export const useGameLoop = ({
  players,
  setPlayers,
  csvData,
  trainedModel,
  concursoNumber,
  setEvolutionData,
  generation,
  addLog,
  updateInterval,
  trainingData,
  setTrainingData,
  setNumbers,
  setDates,
  setNeuralNetworkVisualization,
  setBoardNumbers,
  setModelMetrics,
  setConcursoNumber,
  setGameCount,
  showToast
}: GameLoopDependencies) => {
  const gameLoop = useCallback(async () => {
    if (!csvData.length || !trainedModel || !players.length) {
      console.warn('Game loop called without required data:', {
        hasCsvData: Boolean(csvData.length),
        hasTrainedModel: Boolean(trainedModel),
        hasPlayers: Boolean(players.length)
      });
      return;
    }

    const nextConcurso = (concursoNumber + 1) % csvData.length;
    setConcursoNumber(nextConcurso);
    setGameCount(prev => prev + 1);

    if (nextConcurso % 200 === 0 && trainingData.length > 0) {
      await updateModelWithNewData(trainedModel, trainingData, addLog, showToast);
      setTrainingData([]);
      addLog("system", "Retreino programado executado após 200 jogos");
    }

    const currentBoardNumbers = csvData[nextConcurso];
    setBoardNumbers(currentBoardNumbers);
    
    const validationMetrics = performCrossValidation(
      players[0]?.predictions ? [players[0].predictions] : [],
      csvData.slice(Math.max(0, nextConcurso - 10), nextConcurso)
    );

    const currentDate = new Date();
    const lunarPhase = getLunarPhase(currentDate);
    const lunarPatterns = analyzeLunarPatterns([currentDate], [currentBoardNumbers]);
    
    setNumbers(currentNumbers => {
      const newNumbers = [...currentNumbers, currentBoardNumbers].slice(-100);
      return newNumbers;
    });
    
    setDates(currentDates => [...currentDates, currentDate].slice(-100));

    const playerPredictions = await Promise.all(
      players.map(async player => {
        if (!player) return [];
        
        const prediction = await makePrediction(
          trainedModel, 
          currentBoardNumbers, 
          player.weights, 
          nextConcurso,
          setNeuralNetworkVisualization,
          { lunarPhase, lunarPatterns },
          { numbers: [[...currentBoardNumbers]], dates: [currentDate] }
        );

        const timeSeriesAnalyzer = new TimeSeriesAnalysis([[...currentBoardNumbers]]);
        const arimaPredictor = timeSeriesAnalyzer.analyzeNumbers();
        predictionMonitor.recordPrediction(prediction, currentBoardNumbers, arimaPredictor);

        return prediction;
      })
    );

    const { updatedPlayers, metrics } = processPredictions(
      players,
      playerPredictions,
      currentBoardNumbers,
      addLog,
      showToast
    );

    const totalPredictions = players.length * (nextConcurso + 1);

    setModelMetrics({
      accuracy: metrics.totalMatches / (players.length * 15),
      randomAccuracy: metrics.randomMatches / (players.length * 15),
      totalPredictions,
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

    if (nextConcurso % Math.min(updateInterval, 50) === 0 && trainingData.length > 0) {
      await updateModelWithNewData(trainedModel, trainingData, addLog, showToast);
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
    addLog,
    updateInterval,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setBoardNumbers,
    setNeuralNetworkVisualization,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    showToast
  ]);

  return gameLoop;
};