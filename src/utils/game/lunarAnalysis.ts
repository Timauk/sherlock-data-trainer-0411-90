export interface LunarData {
  currentPhase: string;
  patterns: Record<string, number[]>;
}

export const getLunarPhase = (date: Date): string => {
  // Simplified lunar phase calculation
  const day = date.getDate();
  if (day <= 7) return 'Nova';
  if (day <= 14) return 'Crescente';
  if (day <= 21) return 'Cheia';
  return 'Minguante';
};

export const analyzeLunarPatterns = (
  dates: Date[],
  numbers: number[][]
): Record<string, number[]> => {
  return {
    'Nova': numbers[0] || [],
    'Crescente': numbers[0] || [],
    'Cheia': numbers[0] || [],
    'Minguante': numbers[0] || []
  };
};