import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ProcessingPanelProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (file: File) => void;
  onSaveModel: () => void;
  progress: number;
  champion: any;
  modelMetrics: any;
  gameLogic: any;
  isServerProcessing: boolean;
  serverStatus: string;
  onToggleProcessing: () => void;
  saveFullModel: () => Promise<void>;
  loadFullModel: () => Promise<void>;
  isProcessing: boolean;
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
  isProcessing
}) => {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'model') => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "Erro no Upload",
        description: "Nenhum arquivo selecionado",
        variant: "destructive"
      });
      return;
    }
    
    if (type === 'csv') {
      onCsvUpload(file);
    } else {
      onModelUpload(file);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={onPlay}
          disabled={isPlaying || isProcessing}
          variant="default"
        >
          Iniciar
        </Button>
        
        <Button
          onClick={onPause}
          disabled={!isPlaying || isProcessing}
          variant="secondary"
        >
          Pausar
        </Button>
        
        <Button
          onClick={onReset}
          disabled={isProcessing}
          variant="destructive"
        >
          Resetar
        </Button>
        
        <Button onClick={onThemeToggle} variant="outline">
          Alternar Tema
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileUpload(e, 'csv')}
            className="hidden"
            id="csvUpload"
          />
          <label htmlFor="csvUpload">
            <Button variant="outline" asChild>
              <span>Upload CSV</span>
            </Button>
          </label>
        </div>

        <div>
          <input
            type="file"
            accept=".json"
            onChange={(e) => handleFileUpload(e, 'model')}
            className="hidden"
            id="modelUpload"
          />
          <label htmlFor="modelUpload">
            <Button variant="outline" asChild>
              <span>Upload Modelo</span>
            </Button>
          </label>
        </div>

        <Button onClick={onSaveModel} variant="outline">
          Salvar Modelo
        </Button>
      </div>

      <Progress value={progress} className="w-full" />

      <div>
        {champion && (
          <p>Campeão: {champion.name || 'Sem nome'} (ID: {champion.id || 'N/A'})</p>
        )}
        {modelMetrics && (
          <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
            {JSON.stringify(modelMetrics, null, 2)}
          </pre>
        )}
      </div>

      <div>
        <p>Status do Servidor: {serverStatus}</p>
        <Button
          onClick={onToggleProcessing}
          variant="outline"
          disabled={isProcessing}
        >
          {isServerProcessing ? 'Parar Processamento' : 'Iniciar Processamento'}
        </Button>
      </div>
    </div>
  );
};

export default ProcessingPanel;