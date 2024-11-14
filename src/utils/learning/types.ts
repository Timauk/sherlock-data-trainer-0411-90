export interface FeedbackMetrics {
  accuracy: number;
  loss: number;
  patterns: number;
  reward: number;
  consistency: number;
  novelty: number;
  efficiency: number;
}

export interface MetricsSummary {
  averageAccuracy: number;
  averageLoss: number;
  totalPatterns: number;
  totalReward: number;
  averageConsistency: number;
  averageNovelty: number;
  averageEfficiency: number;
}