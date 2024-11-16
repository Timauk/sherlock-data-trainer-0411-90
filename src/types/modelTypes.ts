export interface ModelUploadProps {
  onModelUpload: (
    jsonFile: File,
    weightsFile: File,
    metadataFile?: File,
    weightSpecsFile?: File
  ) => void;
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
