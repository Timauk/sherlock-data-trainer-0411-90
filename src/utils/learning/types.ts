export interface FeedbackMetrics {
  accuracy: number;
  loss: number;
  patterns: number;
  reward: number;
  patternDepth: number;
}

export interface RewardFactors {
  matches: number;
  consistency: number;
  novelty: number;
  efficiency: number;
  patternDepth: number;
}