import { LayersModel } from '@tensorflow/tfjs';
import { ModelVisualization, Player } from './gameTypes';

export interface ModelUploadProps {
  onModelUpload: (
    jsonFile: File,
    weightsFile: File,
    metadataFile?: File,
    weightSpecsFile?: File
  ) => void;
}

export interface GameLogicProps {
  players: Player[];
  trainedModel: LayersModel | null;
  boardNumbers: number[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  dates: Date[];
  numbers: number[][];
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization: ModelVisualization | null;
  concursoNumber: number;
  toggleInfiniteMode: () => void;
  toggleManualMode: () => void;
  isInfiniteMode: boolean;
  isManualMode: boolean;
  isProcessing?: boolean;
  saveFullModel: () => Promise<void>;
  loadFullModel: () => Promise<void>;
  onUpdatePlayer: (playerId: number, newWeights: number[]) => void;
}

export interface PlayPageContentProps extends ModelUploadProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onSaveModel: () => void;
  progress: number;
  generation: number;
  gameLogic: GameLogicProps;
  isProcessing?: boolean;
}