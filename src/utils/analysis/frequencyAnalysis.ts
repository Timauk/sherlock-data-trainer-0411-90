import NodeCache from 'node-cache';

const frequencyCache = new NodeCache({ 
  stdTTL: 3600, // 1 hora
  checkperiod: 120 // 2 minutos
});

export const calculateFrequencyAnalysis = (numbers: number[][]): Record<number, number> => {
  const cacheKey = JSON.stringify(numbers);
  const cachedResult = frequencyCache.get(cacheKey);
  
  if (cachedResult) {
    return cachedResult as Record<number, number>;
  }

  const frequency: Record<number, number> = {};
  const totalGames = numbers.length;
  
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });
  
  Object.keys(frequency).forEach(key => {
    frequency[Number(key)] = frequency[Number(key)] / totalGames;
  });
  
  frequencyCache.set(cacheKey, frequency);
  return frequency;
};