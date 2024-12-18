export const temporalAccuracyTracker = {
  accuracyHistory: [] as number[],
  getAverageAccuracy: () => {
    if (temporalAccuracyTracker.accuracyHistory.length === 0) return 0;
    const sum = temporalAccuracyTracker.accuracyHistory.reduce((a, b) => a + b, 0);
    return sum / temporalAccuracyTracker.accuracyHistory.length;
  },
  addAccuracy: (accuracy: number) => {
    temporalAccuracyTracker.accuracyHistory.push(accuracy);
    if (temporalAccuracyTracker.accuracyHistory.length > 100) {
      temporalAccuracyTracker.accuracyHistory.shift();
    }
  }
};