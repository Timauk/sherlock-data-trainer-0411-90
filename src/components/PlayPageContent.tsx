import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import GameMetrics from './GameMetrics';
import ControlPanel from './GameControls/ControlPanel';
import AnalysisTabs from './GameAnalysis/AnalysisTabs';
import ChampionPredictions from './ChampionPredictions';
import ProcessingSelector from './ProcessingSelector';
import GeneticTreeVisualization from './GeneticTreeVisualization';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from "@/components/ui/button";
import { Save, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

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
  gameLogic: ReturnType<typeof useGameLogic>;
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
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { status: serverStatus } = useServerStatus();
  const { toast } = useToast();
  
  const champion = gameLogic.players && gameLogic.players.length > 0 
    ? gameLogic.players.reduce((prev, current) => 
        (current.fitness > (prev?.fitness || 0)) ? current : prev, 
        gameLogic.players[0])
    : null;

  const saveFullModel = async () => {
    try {
      const playersData = JSON.parse(localStorage.getItem('playersData') || '[]');
      const evolutionHistory = JSON.parse(localStorage.getItem('evolutionHistory') || '[]');
      
      const response = await fetch('/api/model/save-full-model', {
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
          description: `Modelo salvo com ${result.totalSamples} amostras totais, incluindo conhecimento dos jogadores.`,
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

      const loadedModel = await tf.loadLayersModel(tf.io.browserFiles(
        [modelJson, modelWeights]
      ));

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
      <ProcessingSelector
        isServerProcessing={isServerProcessing}
        onToggleProcessing={() => setIsServerProcessing(prev => !prev)}
        serverStatus={serverStatus}
      />
      
      <GameMetrics 
        progress={progress}
        champion={champion}
        modelMetrics={gameLogic.modelMetrics}
      />
      
      <GeneticTreeVisualization 
        players={gameLogic.players}
        generation={gameLogic.generation}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            disabled={serverStatus === 'checking' || (isServerProcessing && serverStatus === 'offline')}
          />

          <Button
            onClick={saveFullModel}
            className="w-full"
            variant="secondary"
          >
            <Save className="inline-block mr-2" />
            Salvar Modelo Completo
          </Button>

          <Button
            onClick={loadFullModel}
            className="w-full"
            variant="outline"
          >
            <Download className="inline-block mr-2" />
            Carregar Modelo Treinado
          </Button>
        </div>
        
        <ChampionPredictions
          champion={champion}
          trainedModel={gameLogic.trainedModel}
          lastConcursoNumbers={gameLogic.boardNumbers}
          isServerProcessing={isServerProcessing}
        />
      </div>

      <AnalysisTabs
        boardNumbers={gameLogic.boardNumbers}
        concursoNumber={gameLogic.concursoNumber}
        players={gameLogic.players}
        evolutionData={gameLogic.evolutionData}
        dates={gameLogic.dates}
        numbers={gameLogic.numbers}
        updateFrequencyData={gameLogic.updateFrequencyData}
        modelMetrics={gameLogic.modelMetrics}
        neuralNetworkVisualization={gameLogic.neuralNetworkVisualization}
      />
    </div>
  );
};

export default PlayPageContent;