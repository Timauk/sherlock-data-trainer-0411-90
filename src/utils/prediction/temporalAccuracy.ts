export class TemporalAccuracyTracker {
  private accuracyHistory: { timestamp: number; accuracy: number }[] = [];
  private readonly maxHistorySize = 1000;

  recordAccuracy(matches: number, total: number): void {
    const accuracy = matches / total;
    this.accuracyHistory.push({
      timestamp: Date.now(),
      accuracy
    });

    if (this.accuracyHistory.length > this.maxHistorySize) {
      this.accuracyHistory = this.accuracyHistory.slice(-this.maxHistorySize);
    }
  }

  getRecentAccuracy(timeWindowMs: number = 3600000): number {
    const cutoffTime = Date.now() - timeWindowMs;
    const recentEntries = this.accuracyHistory.filter(
      entry => entry.timestamp >= cutoffTime
    );
    return recentEntries.length === 0 ? 0 : 
      recentEntries.reduce((sum, entry) => sum + entry.accuracy, 0) / recentEntries.length;
  }
}

export const temporalAccuracyTracker = new TemporalAccuracyTracker();