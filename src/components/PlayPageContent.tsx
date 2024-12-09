import React from 'react';
import ProcessingSelector from './ProcessingSelector';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlayPageContentProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
  progress: number;
  generation: number;
  gameLogic: any;
  isDataLoaded: boolean;
}

const PlayPageContent: React.FC<PlayPageContentProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  progress,
  generation,
  gameLogic,
  isDataLoaded
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <ControlPanel
        isPlaying={isPlaying}
        onPlay={onPlay}
        onPause={onPause}
        onReset={onReset}
        onThemeToggle={onThemeToggle}
        onCsvUpload={onCsvUpload}
        onModelUpload={onModelUpload}
        onSaveModel={onSaveModel}
        toggleInfiniteMode={gameLogic.toggleInfiniteMode}
        toggleManualMode={gameLogic.toggleManualMode}
        isInfiniteMode={gameLogic.isInfiniteMode}
        isManualMode={gameLogic.isManualMode}
        disabled={!isDataLoaded}
      />

      <GameMetrics 
        progress={progress}
        champion={gameLogic.champion}
        modelMetrics={gameLogic.modelMetrics}
      />

      {!isDataLoaded && (
        <Alert>
          <AlertDescription>
            Para começar, carregue o arquivo CSV com os dados históricos e o modelo treinado.
            Se não tiver um modelo salvo, você precisará treinar um novo.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={onSaveModel}
        className="w-full"
        variant="secondary"
        disabled={!isDataLoaded}
      >
        <Save className="inline-block mr-2" />
        Salvar Modelo Atual
      </Button>
    </div>
  );
};

export default PlayPageContent;