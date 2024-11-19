import React, { useState } from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import ProcessingPanel from './PlayPageContent/ProcessingPanel';
import AnalysisPanel from './PlayPageContent/AnalysisPanel';
import GameActions from './PlayPageContent/GameActions';
import GameBoardSection from './PlayPageContent/GameBoardSection';
import { useToast } from "@/hooks/use-toast";
import { PlayPageContentProps } from '@/types/modelTypes';
import { exportPredictionsToCSV } from '@/utils/exportUtils';

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
  isProcessing = false
}) => {
  const [isServerProcessing, setIsServerProcessing] = useState(false);
  const { status: serverStatus } = useServerStatus();
  const { toast } = useToast();

  const handleExportCSV = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/game/all');
      const allGames = await response.json();
      
      if (allGames && allGames.length > 0) {
        const allPredictions = allGames.flatMap(game => 
          game.predictions.map((pred: any) => ({
            concurso: game.concurso,
            numbers: pred.numbers
          }))
        );
        
        exportPredictionsToCSV(allPredictions, gameLogic.players.slice(0, 80));
        toast({
          title: "Exportação Concluída",
          description: `${allGames.length} jogos foram exportados com sucesso.`,
        });
      } else {
        toast({
          title: "Erro na Exportação",
          description: "Não há dados para exportar.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Erro ao recuperar os jogos do servidor.",
        variant: "destructive"
      });
    }
  };

  // Ensure we only pass the first 80 players to components
  const limitedPlayers = gameLogic.players.slice(0, 80);

  return (
    <div className="flex flex-col gap-6">
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
        champion={limitedPlayers[0]}
        modelMetrics={gameLogic.modelMetrics}
        gameLogic={gameLogic}
        isServerProcessing={isServerProcessing}
        serverStatus={serverStatus}
        onToggleProcessing={() => setIsServerProcessing(prev => !prev)}
        saveFullModel={gameLogic.saveFullModel}
        loadFullModel={gameLogic.loadFullModel}
        isProcessing={isProcessing}
      />

      <GameBoardSection
        players={limitedPlayers}
        evolutionData={gameLogic.evolutionData}
        boardNumbers={gameLogic.boardNumbers}
        concursoNumber={gameLogic.concursoNumber}
        onUpdatePlayer={(playerId: number, newWeights: number[]) => {
          if (gameLogic.onUpdatePlayer) {
            gameLogic.onUpdatePlayer(playerId, newWeights);
          }
        }}
        onCsvUpload={onCsvUpload}
        onModelUpload={onModelUpload}
        onSaveModel={onSaveModel}
      />
      
      <AnalysisPanel
        champion={limitedPlayers[0]}
        trainedModel={gameLogic.trainedModel}
        boardNumbers={gameLogic.boardNumbers}
        isServerProcessing={isServerProcessing}
        players={limitedPlayers}
        generation={generation}
        evolutionData={gameLogic.evolutionData}
        dates={gameLogic.dates}
        numbers={gameLogic.numbers}
        modelMetrics={gameLogic.modelMetrics}
        neuralNetworkVisualization={gameLogic.neuralNetworkVisualization}
        concursoNumber={gameLogic.concursoNumber}
        onExportCSV={handleExportCSV}
      />

      <GameActions
        onSaveFullModel={gameLogic.saveFullModel}
        onLoadFullModel={gameLogic.loadFullModel}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PlayPageContent;