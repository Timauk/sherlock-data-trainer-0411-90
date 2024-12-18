import React from 'react';
import ProcessingSelector from './ProcessingSelector';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import NumberSelector from './NumberSelector';

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

  const handleGenerateGames = () => {
    if (!isDataLoaded) {
      toast({
        title: "Dados não carregados",
        description: "Por favor, carregue o CSV e o modelo antes de gerar jogos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      gameLogic.generateGames();
      toast({
        title: "Jogos Gerados",
        description: "Novos jogos foram gerados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar novos jogos",
        variant: "destructive"
      });
    }
  };

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

      <NumberSelector 
        onNumbersSelected={(numbers) => gameLogic.setSelectedNumbers(numbers)}
        predictions={gameLogic.predictions}
      />

      <Button
        onClick={handleGenerateGames}
        className="w-full"
        variant="default"
        disabled={!isDataLoaded}
      >
        Gerar Jogos
      </Button>

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