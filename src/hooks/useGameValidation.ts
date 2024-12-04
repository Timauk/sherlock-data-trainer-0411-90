import { performCrossValidation } from '@/utils/validation/crossValidation';
import { Player } from '@/types/gameTypes';

export const validateGameState = (
  players: Player[],
  historicalData: number[][],
  currentIndex: number
) => {
  const validationData = historicalData.slice(Math.max(0, currentIndex - 10), currentIndex);
  return performCrossValidation(
    [players[0].predictions],
    validationData,
    10
  );
};