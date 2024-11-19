import React from 'react';
import { useToast } from "@/hooks/use-toast";

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
  saveFullModel: () => void;
  loadFullModel: () => void;
  isProcessing: boolean;
}

const ProcessingPanel = ({ 
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
}: ProcessingPanelProps) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex flex-wrap gap-4">
        <div className="form-group">
          <label htmlFor="csvUpload" className="block text-sm font-medium mb-1">
            Upload CSV
            <input
              id="csvUpload"
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && onCsvUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="modelUpload" className="block text-sm font-medium mb-1">
            Upload Modelo
            <input
              id="modelUpload"
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && onModelUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </label>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          {isPlaying ? 'Pausar' : 'Jogar'}
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Reiniciar
        </button>
        <button
          onClick={onThemeToggle}
          className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          Trocar Tema
        </button>
      </div>

      {isServerProcessing && <p>Processando no servidor...</p>}
      <div className="w-full bg-gray-200 h-2 rounded">
        <div
          className="bg-blue-600 h-full rounded"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div>
        {champion && <p>Campeão: {champion.name || 'Sem nome'}</p>}
        {modelMetrics && (
          <p>Métricas do Modelo: {JSON.stringify(modelMetrics)}</p>
        )}
      </div>
    </div>
  );
};

export default ProcessingPanel;