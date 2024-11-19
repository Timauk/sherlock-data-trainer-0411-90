import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';
import { useGameInterval } from '@/hooks/useGameInterval';
import { loadModelFiles } from '@/utils/modelLoader';
import { loadModelWithWeights, saveModelWithWeights } from '@/utils/modelUtils';
import { systemLogger } from '@/utils/logging/systemLogger';
import { useToast } from "@/hooks/use-toast";

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const { theme, setTheme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  
  const gameLogicHook = useGameLogic(csvData, trainedModel);

  const saveFullModel = async () => {
    if (trainedModel) {
      await saveModelWithWeights(trainedModel);
      systemLogger.log("action", "Modelo salvo com sucesso!");
    }
  };

  const loadFullModel = async () => {
    try {
      const model = await loadModelWithWeights();
      setTrainedModel(model);
      systemLogger.log("action", "Modelo carregado com sucesso!");
    } catch (error) {
      systemLogger.log("action", "Erro ao carregar modelo", {}, 'error');
    }
  };

  const onUpdatePlayer = (playerId: number, newWeights: number[]) => {
    const updatedPlayers = gameLogicHook.players.map(player => 
      player.id === playerId ? { ...player, weights: newWeights } : player
    );
    if ('setPlayers' in gameLogicHook) {
      (gameLogicHook as any).setPlayers(updatedPlayers);
    }
  };

  const handleModelUpload = async (file: File) => {
    try {
      const weightsFile = new File([], 'weights.bin');
      const result = await loadModelFiles(file, weightsFile);
      if (result.model) {
        setTrainedModel(result.model);
        systemLogger.log("action", "Modelo carregado com sucesso!");
      }
    } catch (error) {
      systemLogger.log("action", "Erro ao carregar modelo", { error }, 'error');
      toast({
        title: "Erro ao Carregar Modelo",
        description: error instanceof Error ? error.message : "Falha ao carregar modelo",
        variant: "destructive"
      });
    }
  };

  const gameLogic = {
    ...gameLogicHook,
    saveFullModel,
    loadFullModel,
    onUpdatePlayer
  };

  useGameInterval(
    isPlaying && !isProcessing && isInitialized,
    gameSpeed,
    gameLogic.gameLoop,
    () => {
      setIsPlaying(false);
      systemLogger.log("action", "Todos os concursos foram processados");
    }
  );

  const loadCSV = useCallback(async (file: File) => {
    try {
      setIsInitialized(false);
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });
      
      if (data.length === 0) {
        throw new Error("Arquivo CSV vazio ou inválido");
      }

      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));
      
      systemLogger.log("action", "CSV carregado e processado com sucesso!");
      
      if (gameLogic && gameLogic.initializePlayers) {
        gameLogic.initializePlayers();
      }
    } catch (error) {
      systemLogger.log("action", `Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {}, 'error');
      setIsInitialized(false);
    }
  }, [gameLogic]);

  useEffect(() => {
    if (!isInitialized && gameLogic && gameLogic.players.length === 0) {
      gameLogic.initializePlayers();
      setIsInitialized(true);
      systemLogger.log("action", "Sistema inicializado com sucesso!");
    }
  }, [gameLogic, isInitialized]);

  useEffect(() => {
    if (csvData.length > 0 && trainedModel !== null && gameLogic.players.length === 0) {
      setIsInitialized(true);
      systemLogger.log("action", "Dados e modelo carregados com sucesso!");
      gameLogic.initializePlayers();
    }
  }, [csvData, trainedModel, gameLogic]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl onSpeedChange={setGameSpeed} />
      <PlayPageContent
        isPlaying={isPlaying && !isProcessing}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onReset={() => {
          setIsPlaying(false);
          gameLogic.initializePlayers();
          systemLogger.log("action", "Jogo reiniciado - Estado inicial restaurado");
        }}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={handleModelUpload}
        onSaveModel={saveFullModel}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PlayPage;