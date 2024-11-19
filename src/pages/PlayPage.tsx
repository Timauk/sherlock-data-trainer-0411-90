import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameControls } from '@/hooks/useGameControls';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';

const PlayPage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();

  const gameLogic = useGameLogic(csvData, trainedModel);

  const loadCSV = useCallback(async (file: File) => {
    try {
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
      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));
      gameLogic.addLog("CSV carregado e processado com sucesso!");
      gameLogic.addLog(`Número de registros carregados: ${data.length}`);
    } catch (error) {
      gameLogic.addLog(`Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [gameLogic]);

  const loadModel = useCallback(async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(
        tf.io.browserFiles([jsonFile, weightsFile])
      );
      setTrainedModel(model);
      gameLogic.addLog("Modelo carregado com sucesso!");
      toast({
        title: "Modelo Carregado",
        description: "O modelo foi carregado com sucesso.",
      });
    } catch (error) {
      gameLogic.addLog(`Erro ao carregar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao Carregar Modelo",
        description: "Certifique-se de selecionar tanto o arquivo .json quanto o arquivo .weights.bin",
        variant: "destructive",
      });
    }
  }, [gameLogic, toast]);

  const saveModel = useCallback(async () => {
    if (trainedModel) {
      try {
        await trainedModel.save('downloads://modelo-atual');
        gameLogic.addLog("Modelo salvo com sucesso!");
        toast({
          title: "Modelo Salvo",
          description: "O modelo atual foi salvo com sucesso.",
        });
      } catch (error) {
        gameLogic.addLog(`Erro ao salvar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        console.error("Detalhes do erro:", error);
        toast({
          title: "Erro ao Salvar Modelo",
          description: "Ocorreu um erro ao salvar o modelo. Verifique o console para mais detalhes.",
          variant: "destructive",
        });
      }
    } else {
      gameLogic.addLog("Nenhum modelo para salvar.");
      toast({
        title: "Nenhum Modelo",
        description: "Não há nenhum modelo carregado para salvar.",
        variant: "destructive",
      });
    }
  }, [trainedModel, gameLogic, toast]);

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = 2000 - value[0];
    setGameSpeed(newSpeed);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        gameLogic.gameLoop();
        setProgress((prevProgress) => {
          const newProgress = prevProgress + (100 / csvData.length);
          if (newProgress >= 100) {
            if (!gameLogic.isManualMode) {
              gameLogic.evolveGeneration();
            }
            return gameLogic.isInfiniteMode ? 0 : 100;
          }
          return newProgress;
        });
      }, gameSpeed);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic, gameSpeed]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl gameSpeed={gameSpeed} onSpeedChange={handleSpeedChange} />
      <PlayPageContent
        isPlaying={isPlaying}
        onPlay={playGame}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={loadModel}
        onSaveModel={saveModel}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
      />
    </div>
  );
};

export default PlayPage;