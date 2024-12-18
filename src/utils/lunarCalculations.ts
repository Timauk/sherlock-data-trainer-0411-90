import { differenceInDays, startOfYear } from 'date-fns';

// Calcula a fase da lua baseado na data
export const getLunarPhase = (date: Date): string => {
  const LUNAR_MONTH = 29.53059; // Duração do ciclo lunar em dias
  const KNOWN_NEW_MOON = new Date('2000-01-06').getTime(); // Data conhecida de lua nova
  
  const days = differenceInDays(date, new Date(KNOWN_NEW_MOON));
  const phase = ((days % LUNAR_MONTH) / LUNAR_MONTH) * 100;

  if (phase < 6.25) return 'Nova';
  if (phase < 43.75) return 'Crescente';
  if (phase < 56.25) return 'Cheia';
  if (phase < 93.75) return 'Minguante';
  return 'Nova';
};

// Calcula a estação do ano
export const getSeason = (date: Date): string => {
  const dayOfYear = differenceInDays(date, startOfYear(date));
  
  // Hemisférico Sul
  if (dayOfYear >= 355 || dayOfYear < 80) return 'Verão';
  if (dayOfYear >= 80 && dayOfYear < 172) return 'Outono';
  if (dayOfYear >= 172 && dayOfYear < 264) return 'Inverno';
  return 'Primavera';
};

export const analyzeLunarPatterns = (dates: Date[], numbers: number[][]): Record<string, number[]> => {
  const patterns: Record<string, number[]> = {
    Nova: Array(25).fill(0),
    Crescente: Array(25).fill(0),
    Cheia: Array(25).fill(0),
    Minguante: Array(25).fill(0)
  };

  dates.forEach((date, index) => {
    const phase = getLunarPhase(date);
    numbers[index].forEach(num => {
      patterns[phase][num - 1]++;
    });
  });

  return patterns;
};