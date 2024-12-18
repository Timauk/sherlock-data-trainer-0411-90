import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

export const updatePlayerWithMatchResults = (
  player: Player,
  predictions: number[],
  drawnNumbers: number[],
  score: number
): Player => {
  const matches = predictions.filter(num => drawnNumbers.includes(num)).length;

  const matchHistory = player.matchHistory || [];
  const newMatch = {
    concurso: matchHistory.length + 1,
    matches,
    score,
    predictions,
    drawnNumbers
  };

  systemLogger.log('player', `Atualizando resultados do Jogador #${player.id}`, {
    matches,
    score,
    predictions,
    drawnNumbers
  });

  return {
    ...player,
    predictions,
    score: player.score + score,
    matchHistory: [...matchHistory, newMatch],
    fitness: matches
  };
};