import { Player } from '@/types/gameTypes';
import { calculateReward, logReward } from '@/utils/rewardSystem';
import { temporalAccuracyTracker } from '@/utils/prediction/temporalAccuracy';

export const processPredictions = (
  players: Player[],
  playerPredictions: number[][],
  currentBoardNumbers: number[],
  addLog: (type: string, message: string, matches?: number) => void,
  showToast?: (title: string, description: string) => void
) => {
  let totalMatches = 0;
  let randomMatches = 0;
  let currentGameMatches = 0;
  let currentGameRandomMatches = 0;

  const updatedPlayers = players.map((player, index) => {
    if (!player) return player;
    
    const predictions = playerPredictions[index] || [];
    const matches = predictions.filter(num => currentBoardNumbers.includes(num)).length;
    totalMatches += matches;
    currentGameMatches += matches;

    if (matches >= 15) {
      showToast?.("Resultado Excepcional!", 
        `Jogador ${player.id} acertou ${matches} números!`);
    }

    const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
    randomMatches += randomMatch;
    currentGameRandomMatches += randomMatch;

    temporalAccuracyTracker.recordAccuracy(matches, 15);

    const reward = calculateReward(matches);
    
    if (matches >= 11) {
      const logMessage = logReward(matches, player.id);
      addLog("prediction", logMessage, matches);
      
      if (matches >= 13) {
        showToast?.("Desempenho Excepcional!", 
          `Jogador ${player.id} acertou ${matches} números!`);
      }
    }

    return {
      ...player,
      score: player.score + reward,
      predictions,
      fitness: matches
    };
  });

  return {
    updatedPlayers,
    metrics: {
      totalMatches,
      randomMatches,
      currentGameMatches,
      currentGameRandomMatches
    }
  };
};