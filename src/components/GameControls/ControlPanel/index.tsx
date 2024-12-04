import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Moon } from 'lucide-react';

interface ControlPanelProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
  toggleInfiniteMode: () => void;
  toggleManualMode: () => void;
  isInfiniteMode: boolean;
  isManualMode: boolean;
  disabled?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle,
  onCsvUpload,
  onModelUpload,
  onSaveModel,
  toggleInfiniteMode,
  toggleManualMode,
  isInfiniteMode,
  isManualMode,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={isPlaying ? onPause : onPlay} disabled={disabled}>
          {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isPlaying ? 'Pausar' : 'Iniciar'}
        </Button>
        <Button onClick={onReset} disabled={disabled}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reiniciar
        </Button>
        <Button onClick={onThemeToggle}>
          <Moon className="mr-2 h-4 w-4" />
          Alternar Tema
        </Button>
        <Button onClick={toggleInfiniteMode} disabled={disabled}>
          {isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
        </Button>
        <Button 
          onClick={toggleManualMode}
          variant={isManualMode ? "destructive" : "outline"}
          disabled={disabled}
        >
          {isManualMode ? 'Desativar' : 'Ativar'} Modo Manual
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;