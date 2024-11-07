import React, { useState, useEffect } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import ProcessingPanel from './PlayPageContent/ProcessingPanel';
import AnalysisPanel from './PlayPageContent/AnalysisPanel';
import { useToast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { Badge } from "@/components/ui/badge";
import TotalFitnessChart from './TotalFitnessChart';
import { Player } from '@/types/gameTypes';

interface PlayPageContentProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File, metadataFile: File) => void;
  onSaveModel: () => void;
  progress: number;
  generation: number;
  gameLogic: any;
  currentCycle: number;
  lastCloneCycle: number;
  onClonePlayer: (player: Player) => void;
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
  currentCycle,
  lastCloneCycle,
  onClonePlayer
}) => {
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { status: serverStatus } = useServerStatus();
  const { toast } = useToast();
  
  useEffect(() => {
    // Verificar se temos dados e modelo antes de permitir o início
    const canStart = gameLogic.csvData?.length > 0 && gameLogic.trainedModel;
    
    if (!canStart && isPlaying) {
      onPause();
      toast({
        title: "Não é possível iniciar",
        description: "Carregue um arquivo CSV e um modelo treinado primeiro.",
        variant: "destructive"
      });
    }
  }, [isPlaying, gameLogic.csvData, gameLogic.trainedModel]);

  const cycleCount = gameLogic.cycleCount;
  const gamesUntilNextCycle = gameLogic.csvData?.length 
    ? gameLogic.csvData.length - (gameLogic.gameCount % gameLogic.csvData.length)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-lg p-2">
          Ciclos Completos: {cycleCount}
        </Badge>
        {cycleCount > 0 && (
          <Badge variant="secondary" className="text-lg p-2">
            Próxima Clonagem em: {gamesUntilNextCycle} jogos
          </Badge>
        )}
      </div>

      <ProcessingPanel
        isPlaying={isPlaying}
        onPlay={onPlay}
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
        saveFullModel={gameLogic.saveModel}
        loadFullModel={gameLogic.loadModel}
      />
      
      <TotalFitnessChart fitnessData={gameLogic.fitnessData} />
      
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
        currentCycle={currentCycle}
        lastCloneCycle={lastCloneCycle}
        onClonePlayer={onClonePlayer}
      />
    </div>
  );
};

export default PlayPageContent;