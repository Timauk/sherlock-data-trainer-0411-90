export interface ModelUploadProps {
  onModelUpload: (jsonFile: File, weightsFile: File, metadataFile: File, weightSpecsFile: File) => void;
}

export interface GameLogicProps {
  players: any[];
  modelMetrics: any;
  trainedModel: any;
  boardNumbers: number[];
  evolutionData: any;
  dates: Date[];
  numbers: number[][];  // Changed from number[] to number[][] to match the actual data structure
  neuralNetworkVisualization: any;
  concursoNumber: number;
  toggleInfiniteMode: () => void;
  toggleManualMode: () => void;
  isInfiniteMode: boolean;
  isManualMode: boolean;
}