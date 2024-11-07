import React from 'react';
import ProcessingSelector from '../ProcessingSelector';
import GameMetrics from '../GameMetrics';
import ControlPanel from '../GameControls/ControlPanel';
import { Button } from "@/components/ui/button";
import { Save, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ProcessingPanelProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File, metadataFile: File) => void;
  onSaveModel: () => void;
  progress: number;
  champion: any;
  modelMetrics: any;
  gameLogic: any;
  isServerProcessing: boolean;
  serverStatus: 'online' | 'offline' | 'checking';
  onToggleProcessing: () => void;
  saveFullModel: () => Promise<void>;
  loadFullModel: () => Promise<void>;
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
  loadFullModel
}) => {
  const { toast } = useToast();

  const handleSaveFullModel = async () => {
    try {
      // Pausar o jogo antes de salvar
      if (isPlaying) {
        onPause();
      }

      await saveFullModel();
      
      toast({
        title: "Estado Completo Salvo",
        description: "O modelo e o estado do jogo foram salvos com sucesso. Você pode continuar jogando ou fechar o jogo com segurança.",
      });
    } catch (error) {
      console.error("Detalhes do erro ao salvar:", error);
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar o estado completo",
        variant: "destructive"
      });
    }
  };

  const handleLoadFullModel = async () => {
    try {
      // Pausar o jogo antes de carregar
      if (isPlaying) {
        onPause();
      }

      await loadFullModel();
      
      toast({
        title: "Estado Completo Carregado",
        description: "O modelo e o estado do jogo foram restaurados com sucesso. A página será recarregada para aplicar as mudanças.",
      });

      // Aguardar um pouco para o usuário ver a mensagem
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Detalhes do erro ao carregar:", error);
      toast({
        title: "Erro ao Carregar",
        description: error instanceof Error ? error.message : "Erro ao carregar o estado completo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
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
        disabled={serverStatus === 'checking' || (isServerProcessing && serverStatus === 'offline')}
      />

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleSaveFullModel}
          className="w-full bg-green-600 hover:bg-green-700"
          variant="secondary"
          disabled={serverStatus !== 'online'}
        >
          <Save className="inline-block mr-2" />
          Salvar Estado Completo do Jogo
        </Button>

        <Button
          onClick={handleLoadFullModel}
          className="w-full"
          variant="outline"
          disabled={serverStatus !== 'online'}
        >
          <Download className="inline-block mr-2" />
          Carregar Último Estado Salvo
        </Button>
      </div>
    </div>
  );
};

export default ProcessingPanel;