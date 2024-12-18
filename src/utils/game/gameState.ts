import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { calculateReward } from '@/utils/rewardSystem';

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

  systemLogger.log('game', 'Iniciando comparação de números', {
    currentBoardNumbers,
    totalPlayers: players.length,
    timestamp: new Date().toISOString()
  });

  const updatedPlayers = players.map((player, index) => {
    const playerPredictions = predictions[index];
    const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
    
    systemLogger.log('game', `Comparação do Jogador #${player.id}`, {
      playerPredictions,
      currentBoardNumbers,
      matches,
      timestamp: new Date().toISOString()
    });

    totalMatches += matches;
    currentGameMatches += matches;
    
    const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
    randomMatches += randomMatch;
    currentGameRandomMatches += randomMatch;

    const reward = calculateReward(matches);
    
    if (matches >= 11) {
      const logMessage = `Jogador ${player.id} acertou ${matches} números!`;
      addLog(logMessage);
      
      if (matches >= 13 && showToast) {
        showToast("Desempenho Excepcional!", 
          `Jogador ${player.id} acertou ${matches} números!`);
      }
    }

    const updatedPlayer = {
      ...player,
      score: player.score + reward,
      predictions: playerPredictions,
      fitness: matches
    };

    systemLogger.log('game', `Atualização do Jogador #${player.id}`, {
      previousScore: player.score,
      newScore: updatedPlayer.score,
      reward,
      matches,
      timestamp: new Date().toISOString()
    });

    return updatedPlayer;
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