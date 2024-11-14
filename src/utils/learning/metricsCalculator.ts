export const calculateConsistency = (patterns: number[][]): number => {
  if (patterns.length < 2) return 0;
  
  let consistencyScore = 0;
  for (let i = 1; i < patterns.length; i++) {
    const prev = new Set(patterns[i - 1]);
    const curr = new Set(patterns[i]);
    const intersection = new Set([...prev].filter(x => curr.has(x)));
    consistencyScore += intersection.size / Math.max(prev.size, curr.size);
  }
  
  return consistencyScore / (patterns.length - 1);
};

export const calculateNovelty = (prediction: number[], history: number[][]): number => {
  const predictionSet = new Set(prediction);
  const historicalNumbers = new Set(history.flat());
  
  const novelElements = [...predictionSet].filter(num => !historicalNumbers.has(num));
  return novelElements.length / predictionSet.size;
};

export const calculateEfficiency = (matches: number, prediction: number[], actual: number[]): number => {
  const precision = matches / prediction.length;
  const recall = matches / actual.length;
  
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
};