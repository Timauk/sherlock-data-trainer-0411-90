import { Player, ModelVisualization } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';

export interface GameLoopDependencies {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  csvData: number[][];
  trainedModel: tf.LayersModel | null;
  concursoNumber: number;
  setEvolutionData: (data: any) => void;
  generation: number;
  addLog: (type: string, message: string, matches?: number) => void;
  updateInterval: number;
  trainingData: number[][];
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>;
  setNumbers: React.Dispatch<React.SetStateAction<number[][]>>;
  setDates: React.Dispatch<React.SetStateAction<Date[]>>;
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void;
  setBoardNumbers: (numbers: number[]) => void;
  setModelMetrics: (metrics: GameMetrics) => void;
  setConcursoNumber: (num: number) => void;
  setGameCount: React.Dispatch<React.SetStateAction<number>>;
  showToast?: (title: string, description: string) => void;
}

export interface GameMetrics {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
  perGameAccuracy: number;
  perGameRandomAccuracy: number;
}