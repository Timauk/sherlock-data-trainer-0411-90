import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import ProcessingPanel from './PlayPageContent/ProcessingPanel';
import AnalysisPanel from './PlayPageContent/AnalysisPanel';
import { useToast } from "@/hooks/use-toast";

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
  gameLogic
}) => {
  const [isServerProcessing, setIsServerProcessing] = useState(true);
  const { status: serverStatus } = useServerStatus();
  const { toast } = useToast();
  
  const processGame = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/processing/process-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputData: gameLogic.currentInput,
          generation,
          playerWeights: gameLogic.playerWeights,
          isInfiniteMode: gameLogic.isInfiniteMode,
          isManualMode: gameLogic.isManualMode
        })
      });

      if (!response.ok) {
        throw new Error('Erro no processamento do servidor');
      }

      const result = await response.json();
      // Update game state with server response
      gameLogic.updateGameState(result);
    } catch (error) {
      toast({
        title: "Erro no Processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const champion = gameLogic.players && gameLogic.players.length > 0 
    ? gameLogic.players.reduce((prev, current) => 
        (current.fitness > (prev?.fitness || 0)) ? current : prev, 
        gameLogic.players[0])
    : null;

  const saveFullModel = async () => {
    try {
      const playersData = JSON.parse(localStorage.getItem('playersData') || '[]');
      const evolutionHistory = JSON.parse(localStorage.getItem('evolutionHistory') || '[]');
      
      const response = await fetch('http://localhost:3001/api/model/save-full-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playersData,
          evolutionHistory
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Modelo Completo Salvo",
          description: `Modelo salvo com ${result.totalSamples} amostras totais.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao Salvar Modelo Completo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const loadFullModel = async () => {
    try {
      const [modelJson, modelWeights] = await Promise.all([
        new Promise<File>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) resolve(files[0]);
          };
          input.click();
        }),
        new Promise<File>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.bin';
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) resolve(files[0]);
          };
          input.click();
        })
      ]);

      onModelUpload(modelJson, modelWeights);
      toast({
        title: "Modelo Carregado",
        description: "O modelo treinado foi carregado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao Carregar Modelo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ProcessingPanel
        isPlaying={isPlaying}
        onPlay={async () => {
          await processGame();
          onPlay();
        }}
        onPause={onPause}
        onReset={onReset}
        onThemeToggle={onThemeToggle}
        onCsvUpload={onCsvUpload}
        onModelUpload={onModelUpload}
        onSaveModel={onSaveModel}
        progress={progress}
        champion={gameLogic.champion}
        modelMetrics={gameLogic.modelMetrics}
        gameLogic={gameLogic}
        isServerProcessing={isServerProcessing}
        serverStatus={serverStatus}
        onToggleProcessing={() => setIsServerProcessing(prev => !prev)}
        saveFullModel={gameLogic.saveFullModel}
        loadFullModel={gameLogic.loadFullModel}
      />
      
      <AnalysisPanel
        champion={gameLogic.champion}
        trainedModel={gameLogic.trainedModel}
        boardNumbers={gameLogic.boardNumbers}
        isServerProcessing={isServerProcessing}
        players={gameLogic.players}
        generation={generation}
        evolutionData={gameLogic.evolutionData}
        dates={gameLogic.dates}
        numbers={gameLogic.numbers}
        modelMetrics={gameLogic.modelMetrics}
        neuralNetworkVisualization={gameLogic.neuralNetworkVisualization}
        concursoNumber={gameLogic.concursoNumber}
      />
    </div>
  );
};

export default PlayPageContent;
