import { differenceInDays, getDay, getMonth } from 'date-fns';

interface AdvancedMetrics {
  dayOfWeekPatterns: number[];
  monthlyPatterns: number[];
  seasonalTrends: number[];
  numberGaps: number[];
  consecutivePatterns: number[];
  sumPatterns: number;
  consecutive: number;  // Added this
  evenOdd: number;     // Added this
}

export const analyzeAdvancedPatterns = (
  numbers: number[][],
  dates: Date[]
): AdvancedMetrics => {
  const dayOfWeekPatterns = Array(7).fill(0);
  const monthlyPatterns = Array(12).fill(0);
  const seasonalTrends = Array(4).fill(0);
  const numberGaps = Array(25).fill(0);
  const consecutivePatterns = Array(24).fill(0);
  let sumPatterns = 0;
  let consecutive = 0;
  let evenOdd = 0;

  // Analisa padrões por dia da semana
  dates.forEach((date, idx) => {
    const dayOfWeek = getDay(date);
    dayOfWeekPatterns[dayOfWeek] += numbers[idx].length;
  });

  // Analisa padrões mensais
  dates.forEach((date, idx) => {
    const month = getMonth(date);
    monthlyPatterns[month] += numbers[idx].length;
  });

  // Analisa gaps entre números e consecutivos
  numbers.forEach(draw => {
    draw.forEach((num, idx) => {
      if (idx > 0) {
        const gap = num - draw[idx - 1] - 1;
        if (gap >= 0 && gap < numberGaps.length) {
          numberGaps[gap]++;
        }
        if (num === draw[idx - 1] + 1) {
          consecutive++;
        }
      }
    });

    // Análise par/ímpar
    const evenCount = draw.filter(n => n % 2 === 0).length;
    evenOdd += evenCount / draw.length;
  });

  // Calcula soma dos números por sorteio
  numbers.forEach(draw => {
    sumPatterns += draw.reduce((acc, curr) => acc + curr, 0);
  });

  // Normaliza os padrões
  const totalGames = numbers.length || 1;
  return {
    dayOfWeekPatterns: dayOfWeekPatterns.map(v => v / totalGames),
    monthlyPatterns: monthlyPatterns.map(v => v / totalGames),
    seasonalTrends: seasonalTrends.map(v => v / totalGames),
    numberGaps: numberGaps.map(v => v / totalGames),
    consecutivePatterns: consecutivePatterns.map(v => v / totalGames),
    sumPatterns: sumPatterns / totalGames,
    consecutive: consecutive / totalGames,
    evenOdd: evenOdd / totalGames
  };
};

export const enrichPredictionData = (
  baseData: number[],
  advancedMetrics: AdvancedMetrics
): number[] => {
  return [
    ...baseData,
    ...advancedMetrics.dayOfWeekPatterns,
    ...advancedMetrics.monthlyPatterns,
    advancedMetrics.sumPatterns
  ];
};