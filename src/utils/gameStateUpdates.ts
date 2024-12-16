import { Player } from '@/types/gameTypes';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';
import { systemLogger } from './logging/systemLogger';

export const updatePlayerStates = (
  players: Player[],
  predictions: number[][],
  currentBoardNumbers: number[],
  nextConcurso: number,
  addLog: (message: string) => void,
  showToast?: (title: string, description: string) => void
) => {
  let totalMatches = 0;
  let randomMatches = 0;
  let currentGameMatches = 0;
  let currentGameRandomMatches = 0;
  const totalPredictions = players.length * (nextConcurso + 1);

  systemLogger.log('game', 'Iniciando atualização de estados dos jogadores', {
    totalPlayers: players.length,
    currentBoardNumbers,
    nextConcurso,
    timestamp: new Date().toISOString()
  });

  const updatedPlayers = players.map((player, index) => {
    const playerPredictions = predictions[index];
    const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
    
    systemLogger.log('game', `Calculando métricas do Jogador #${player.id}`, {
      predictions: playerPredictions,
      currentBoardNumbers,
      matches,
      previousScore: player.score,
      previousFitness: player.fitness,
      timestamp: new Date().toISOString()
    });

    totalMatches += matches;
    currentGameMatches += matches;
    
    const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
    randomMatches += randomMatch;
    currentGameRandomMatches += randomMatch;

    temporalAccuracyTracker.recordAccuracy(matches, 15);

    const reward = calculateReward(matches);
    
    if (matches >= 11) {
      const logMessage = logReward(matches, player.id);
      addLog(logMessage);
      
      if (matches >= 13) {
        showToast?.("Desempenho Excepcional!", 
          `Jogador ${player.id} acertou ${matches} números!`);
      }
    }

    const updatedPlayer = {
      ...player,
      score: player.score + reward,
      predictions: playerPredictions,
      fitness: matches
    };

    systemLogger.log('game', `Estado atualizado do Jogador #${player.id}`, {
      newScore: updatedPlayer.score,
      newFitness: updatedPlayer.fitness,
      reward,
      timestamp: new Date().toISOString()
    });

    return updatedPlayer;
  });

  systemLogger.log('game', 'Métricas globais da rodada', {
    totalMatches,
    randomMatches,
    currentGameMatches,
    currentGameRandomMatches,
    totalPredictions,
    accuracy: totalMatches / (players.length * 15),
    timestamp: new Date().toISOString()
  });

  return {
    updatedPlayers,
    metrics: {
      totalMatches,
      randomMatches,
      currentGameMatches,
      currentGameRandomMatches,
      totalPredictions
    }
  };
};