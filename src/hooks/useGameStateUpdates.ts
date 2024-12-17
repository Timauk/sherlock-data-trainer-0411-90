import { Player } from '@/types/gameTypes';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { temporalAccuracyTracker } from '@/utils/predictions/predictionCore';
import { systemLogger } from '@/utils/logging/systemLogger';

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

  const updatedPlayers = players.map((player, index) => {
    const playerPredictions = predictions[index];
    const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
    totalMatches += matches;
    currentGameMatches += matches;
    
    const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
    randomMatches += randomMatch;
    currentGameRandomMatches += randomMatch;

    // Pass both required arguments: matches and total possible matches (15)
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

    return {
      ...player,
      score: player.score + reward,
      predictions: playerPredictions,
      fitness: matches
    };
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
