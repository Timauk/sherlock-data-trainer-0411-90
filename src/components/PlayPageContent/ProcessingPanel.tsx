import React from 'react';
import ProcessingSelector from '../ProcessingSelector';
import GameMetrics from '../GameMetrics';
import ControlPanel from '../GameControls/ControlPanel';
import { Button } from "@/components/ui/button";
import { Save, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ModelUploadProps, GameLogicProps } from '@/types/modelTypes';
import { Progress } from "@/components/ui/progress";

interface ProcessingPanelProps extends ModelUploadProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onSaveModel: () => void;
  progress: number;
  champion: any;
  modelMetrics: any;
  gameLogic: GameLogicProps;
  isServerProcessing: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  onToggleProcessing: () => void;
  saveFullModel: () => Promise<void>;
  loadFullModel: () => Promise<void>;
  isProcessing?: boolean;
}

const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  progress,
  champion,
  modelMetrics,
  gameLogic,
  isServerProcessing,
  serverStatus,
  onToggleProcessing,
  saveFullModel,
  loadFullModel,
  isProcessing = false
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      {isProcessing && (
        <div className="p-4 bg-secondary rounded-lg">
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Processando jogada... {Math.round(progress)}%
          </p>
        </div>
      )}

      <ProcessingSelector
        isServerProcessing={isServerProcessing}
        onToggleProcessing={onToggleProcessing}
        serverStatus={serverStatus}
      />
      
      <GameMetrics 
        progress={progress}
        champion={champion}
        modelMetrics={modelMetrics}
      />
      
      <ControlPanel
        isPlaying={isPlaying}
        onPlay={() => {
          toast({
            title: "Iniciando jogo",
            description: "Aguarde enquanto processamos a primeira jogada..."
          });
          onPlay();
        }}
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
        disabled={serverStatus === 'checking' || (isServerProcessing && serverStatus === 'offline') || isProcessing}
      />

      <Button
        onClick={saveFullModel}
        className="w-full"
        variant="secondary"
        disabled={isProcessing}
      >
        <Save className="inline-block mr-2" />
        Salvar Modelo Completo
      </Button>

      <Button
        onClick={loadFullModel}
        className="w-full"
        variant="outline"
        disabled={isProcessing}
      >
        <Download className="inline-block mr-2" />
        Carregar Modelo Treinado
      </Button>
    </div>
  );
};

export default ProcessingPanel;