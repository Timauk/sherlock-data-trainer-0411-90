import { Player } from '@/types/gameTypes';

export interface PredictionResult {
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}

export interface PredictionConfig {
  phase: string;
  patterns: any;
  lunarPatterns?: any;
}

export interface SystemStatus {
  color: string;
  text: string;
  icon: JSX.Element;
  ready: boolean;
}
