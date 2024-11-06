import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import ProcessingPanel from './PlayPageContent/ProcessingPanel';
import AnalysisPanel from './PlayPageContent/AnalysisPanel';
import { useToast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { Badge } from "@/components/ui/badge";
import TotalFitnessChart from './TotalFitnessChart';

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
  
  // Calcular dados de fitness total
  const fitnessData = gameLogic.players && gameLogic.players.length > 0 
    ? Array.from({ length: gameLogic.gameCount }, (_, index) => ({
        gameNumber: index + 1,
        totalFitness: gameLogic.players.reduce((sum, player) => sum + player.fitness, 0)
      }))
    : [];

  const cycleCount = Math.floor(gameLogic.gameCount / gameLogic.csvData?.length) || 0;
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-lg p-2">
          Ciclos Completos: {cycleCount}
        </Badge>
        {cycleCount > 0 && (
          <Badge variant="secondary" className="text-lg p-2">
            Próxima Clonagem em: {gameLogic.csvData?.length - (gameLogic.gameCount % gameLogic.csvData?.length)} jogos
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
      />
      
      <TotalFitnessChart fitnessData={fitnessData} />
      
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
