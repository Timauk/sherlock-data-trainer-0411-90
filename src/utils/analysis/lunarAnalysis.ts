import NodeCache from 'node-cache';

const lunarCache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

export const getLunarNumberWeight = (number: number, phase: string): number => {
  const cacheKey = `${number}-${phase}`;
  const cachedWeight = lunarCache.get(cacheKey);
  
  if (cachedWeight) {
    return cachedWeight as number;
  }

  const phaseWeights: Record<string, number> = {
    'Nova': 0.8,
    'Crescente': 1.2,
    'Cheia': 1.0,
    'Minguante': 0.9
  };
  
  const weight = phaseWeights[phase] || 1.0;
  lunarCache.set(cacheKey, weight);
  return weight;
};