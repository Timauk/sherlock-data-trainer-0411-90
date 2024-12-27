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
  systemLogger.log('game', 'Iniciando atualização de estados dos jogadores', {
    totalPlayers: players.length,
    currentBoardNumbers,
    nextConcurso,
    timestamp: new Date().toISOString()
  });

  let totalMatches = 0;
  let randomMatches = 0;
  let currentGameMatches = 0;
  let currentGameRandomMatches = 0;
  const totalPredictions = players.length * (nextConcurso + 1);

  const updatedPlayers = players.map((player, index) => {
    const playerPredictions = predictions[index];
    
    systemLogger.log('game', `Processando predições do Jogador #${player.id}`, {
      predictions: playerPredictions,
      currentScore: player.score,
      generation: player.generation,
      timestamp: new Date().toISOString()
    });

    const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
    
    systemLogger.log('game', `Resultado da comparação para Jogador #${player.id}`, {
      matches,
      predictions: playerPredictions,
      drawnNumbers: currentBoardNumbers,
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
      
      systemLogger.log('game', 'Desempenho excepcional detectado', {
        playerId: player.id,
        matches,
        reward,
        timestamp: new Date().toISOString()
      });
      
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

    systemLogger.log('game', `Estado atualizado do Jogador #${player.id}`, {
      previousScore: player.score,
      newScore: updatedPlayer.score,
      reward,
      matches,
      fitness: updatedPlayer.fitness,
      timestamp: new Date().toISOString()
    });

    return updatedPlayer;
  });

  systemLogger.log('game', 'Atualização de estados concluída', {
    totalMatches,
    randomMatches,
    averageMatches: totalMatches / players.length,
    bestPerformance: Math.max(...updatedPlayers.map(p => p.score)),
    worstPerformance: Math.min(...updatedPlayers.map(p => p.score)),
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