export interface SystemStatus {
  color: string;
  text: string;
  icon: JSX.Element;
  ready: boolean;
}

export interface PredictionResult {
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}