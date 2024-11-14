import NodeCache from 'node-cache';

const patternCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

export const calculatePatternScore = (number: number, patterns: any): number => {
  const cacheKey = `pattern-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  if (!patterns) return 0;
  
  const { consecutive, evenOdd } = patterns;
  const isEven = number % 2 === 0;
  
  const score = (consecutive * 0.5) + (isEven ? evenOdd : (1 - evenOdd)) * 0.5;
  patternCache.set(cacheKey, score);
  return score;
};

export const calculateConsistencyScore = (number: number, patterns: any): number => {
  const cacheKey = `consistency-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  const score = 0.5; // Lógica de consistência existente
  patternCache.set(cacheKey, score);
  return score;
};

export const calculateVariabilityScore = (number: number, patterns: any): number => {
  const cacheKey = `variability-${number}-${JSON.stringify(patterns)}`;
  const cachedScore = patternCache.get(cacheKey);
  
  if (cachedScore) {
    return cachedScore as number;
  }

  const score = 0.5; // Lógica de variabilidade existente
  patternCache.set(cacheKey, score);
  return score;
};