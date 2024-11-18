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
import { Progress } from "@/components/ui/progress";
import { systemLogger } from '@/utils/logging/systemLogger';
import { Card } from '@/components/ui/card';

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
  const gameLogic = useGameLogic(csvData, trainedModel);

  useEffect(() => {
    if (!isInitialized && gameLogic) {
      gameLogic.initializePlayers();
      setIsInitialized(true);
      systemLogger.log("action", "Sistema inicializado com sucesso!");
    }
  }, [gameLogic, isInitialized]);

  useEffect(() => {
    if (csvData.length > 0 && trainedModel !== null) {
      setIsInitialized(true);
      systemLogger.log("action", "Dados e modelo carregados com sucesso!");
      gameLogic.initializePlayers();
    }
  }, [csvData, trainedModel, gameLogic]);

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
    } catch (error) {
      systemLogger.log("action", `Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {}, 'error');
      setIsInitialized(false);
    }
  }, []);

  const loadModel = useCallback(async (jsonFile: File, weightsFile: File, metadataFile: File, weightSpecsFile: File) => {
    try {
      setIsInitialized(false);
      const { model, metadata } = await loadModelFiles(jsonFile, weightsFile, metadataFile, weightSpecsFile);
      setTrainedModel(model);
      await saveModelWithWeights(model);
      systemLogger.log("action", "Modelo e metadata carregados com sucesso!");
      if (metadata.playersData) {
        gameLogic.initializePlayers();
      }
    } catch (error) {
      systemLogger.log("action", `Erro ao carregar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {}, 'error');
      console.error("Detalhes do erro:", error);
      setIsInitialized(false);
    }
  }, [gameLogic]);

  const handlePlay = () => {
    if (!isInitialized) {
      systemLogger.log("action", "Sistema não inicializado. Carregue o CSV e o modelo antes de iniciar.", {}, 'warning');
      return;
    }
    setIsPlaying(true);
    systemLogger.log("action", "Iniciando processamento dos jogos...");
  };

  const saveModel = useCallback(async () => {
    if (trainedModel) {
      try {
        await saveModelWithWeights(trainedModel);
        systemLogger.log("action", "Modelo salvo com sucesso!");
      } catch (error) {
        systemLogger.log("action", `Erro ao salvar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, {}, 'error');
        console.error("Detalhes do erro:", error);
      }
    } else {
      systemLogger.log("action", "Nenhum modelo para salvar.", {}, 'warning');
    }
  }, [trainedModel]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl onSpeedChange={setGameSpeed} />
      <PlayPageContent
        isPlaying={isPlaying && !isProcessing}
        onPlay={handlePlay}
        onPause={() => setIsPlaying(false)}
        onReset={() => {
          setIsPlaying(false);
          gameLogic.initializePlayers();
          systemLogger.log("action", "Jogo reiniciado - Estado inicial restaurado");
        }}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={loadModel}
        onSaveModel={saveModel}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PlayPage;