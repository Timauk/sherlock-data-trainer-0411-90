import React, { useState, useEffect } from 'react';
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

  const loadCSV = async (file: File) => {
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
  };

  const handleSpeedChange = (value: number[]) => {
    setGameSpeed(2000 - value[0]);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying && csvData.length > 0) {
      intervalId = setInterval(() => {
        if (csvData.length > 0 && gameLogic.numbers.length > 0) {
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
        } else {
          console.warn('No input data available for game loop');
          pauseGame();
          toast({
            title: "Erro no Processamento",
            description: "Dados de entrada não disponíveis. Carregue um arquivo CSV primeiro.",
            variant: "destructive"
          });
        }
      }, gameSpeed);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic, gameSpeed, pauseGame, toast]);

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
        onModelUpload={(jsonFile, weightsFile) => {
          tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]))
            .then(setTrainedModel)
            .catch(error => {
              console.error('Error loading model:', error);
              toast({
                title: "Erro ao Carregar Modelo",
                description: "Ocorreu um erro ao carregar o modelo.",
                variant: "destructive"
              });
            });
        }}
        onSaveModel={() => {
          if (trainedModel) {
            trainedModel.save('downloads://modelo-atual');
          }
        }}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
      />
    </div>
  );
};

export default PlayPage;