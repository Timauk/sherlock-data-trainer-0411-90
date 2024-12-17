import * as tf from '@tensorflow/tfjs';

export interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
  modelConnection: {
    lastPrediction: number[] | null;
    confidence: number;
    successRate: number;
    lastUpdate?: string;
  };
  matchHistory?: Array<{
    concurso: number;
    matches: number;
    score: number;
    predictions: number[];
    drawnNumbers: number[];
  }>;
}

export interface PredictionResult {
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}

export interface SystemStatus {
  color: string;
  text: string;
  icon: JSX.Element;
  ready: boolean;
}

export interface ModelVisualization {
  input: number[];
  output: number[];
  weights: number[][];
}

export interface Champion {
  player: Player;
  trainingData: number[][];
}