export interface PredictionScore {
  number: number;
  score: number;
  confidence: number;
}

export interface LunarData {
  lunarPhase: string;
  lunarPatterns: Record<string, number[]>;
}