export interface LunarData {
  phase: string;  // Changed from currentPhase to match the interface
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
  const patterns: Record<string, number[]> = {
    'Nova': Array(25).fill(0),
    'Crescente': Array(25).fill(0),
    'Cheia': Array(25).fill(0),
    'Minguante': Array(25).fill(0)
  };

  dates.forEach((date, index) => {
    const phase = getLunarPhase(date);
    if (numbers[index]) {
      numbers[index].forEach(num => {
        if (patterns[phase]) {
          patterns[phase][num - 1] = (patterns[phase][num - 1] || 0) + 1;
        }
      });
    }
  });

  return patterns;
};