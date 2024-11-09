export interface ModelUploadProps {
  onModelUpload: (jsonFile: File, weightsFile: File, metadataFile: File, weightSpecsFile: File) => void;
}

export interface GameLogicProps {
  players: any[];
  modelMetrics: any;
  trainedModel: any;
  boardNumbers: any[];
  evolutionData: any;
  dates: Date[];
  numbers: number[];
  neuralNetworkVisualization: any;
  concursoNumber: number;
  toggleInfiniteMode: () => void;
  toggleManualMode: () => void;
  isInfiniteMode: boolean;
  isManualMode: boolean;
}