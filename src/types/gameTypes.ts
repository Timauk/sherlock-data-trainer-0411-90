export interface Player {
  id: number;
  score: number;
  predictions: number[];
  weights: number[];
  fitness: number;
  generation: number;
  age: number;
  niche: number; // 0: pares, 1: ímpares, 2: sequências, 3: geral
}

export interface ModelVisualization {
  input: number[];
  output: number[];
  weights: number[][];
}