export interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
  matchHistory?: Array<{
    concurso: number;
    matches: number;
    score: number;
    predictions: number[];
    drawnNumbers: number[];
  }>;
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