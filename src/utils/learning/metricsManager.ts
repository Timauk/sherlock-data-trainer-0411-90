import { FeedbackMetrics } from './types';

export class MetricsManager {
  private metrics: FeedbackMetrics[] = [];
  private readonly maxMetrics = 1000;

  recordMetrics(metrics: FeedbackMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetricsSummary() {
    const count = this.metrics.length || 1;
    const sum = this.metrics.reduce(
      (acc, curr) => ({
        accuracy: acc.accuracy + curr.accuracy,
        loss: acc.loss + curr.loss,
        patterns: acc.patterns + curr.patterns,
        reward: acc.reward + curr.reward,
        patternDepth: acc.patternDepth + curr.patternDepth
      }),
      { accuracy: 0, loss: 0, patterns: 0, reward: 0, patternDepth: 0 }
    );

    return {
      averageAccuracy: sum.accuracy / count,
      averageLoss: sum.loss / count,
      totalPatterns: sum.patterns,
      totalReward: sum.reward,
      averagePatternDepth: sum.patternDepth / count
    };
  }
}