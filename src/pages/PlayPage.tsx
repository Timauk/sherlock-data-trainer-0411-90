import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameControls } from '@/hooks/useGameControls';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';
import { validateGameState, validateCsvStructure } from '@/utils/validation/gameValidation';
import { systemLogger } from '@/utils/logging/systemLogger';

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
      
      // Valida estrutura do CSV antes de processar
      if (!validateCsvStructure(text)) {
        throw new Error('Formato do CSV inválido');
      }

      const lines = text.trim().split('\n').slice(1);
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });

      // Valida os números extraídos
      const isValidNumbers = data.every(d => 
        d.bolas.length === 15 && 
        d.bolas.every(n => n >= 1 && n <= 25)
      );

      if (!isValidNumbers) {
        throw new Error('Números inválidos encontrados no CSV');
      }

      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));
      
      systemLogger.log('csv', 'CSV processado com sucesso', {
        totalRegistros: data.length,
        primeiraLinha: data[0],
        ultimaLinha: data[data.length - 1]
      });

      toast({
        title: "Dados Carregados",
        description: `${data.length} registros foram carregados com sucesso.`,
      });
    } catch (error) {
      systemLogger.log('error', 'Erro ao carregar CSV', { error });
      toast({
        title: "Erro ao Carregar Dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleSpeedChange = (value: number[]) => {
    setGameSpeed(2000 - value[0]);
  };

  const validateAndStartGame = () => {
    const validation = validateGameState(
      csvData,
      gameLogic.champion,
      trainedModel,
      gameLogic.numbers
    );

    if (!validation.isValid) {
      toast({
        title: "Não é possível iniciar o jogo",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return false;
    }

    systemLogger.log('game', 'Jogo iniciado com sucesso', {
      csvRegistros: csvData.length,
      modeloCarregado: !!trainedModel,
      campeaoId: gameLogic.champion?.id
    });

    return true;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying) {
      if (!validateAndStartGame()) {
        pauseGame();
        return;
      }

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
          systemLogger.log('warning', 'Loop do jogo interrompido', {
            csvLength: csvData.length,
            numbersLength: gameLogic.numbers.length
          });
          pauseGame();
        }
      }, gameSpeed);
    }
    
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic, gameSpeed, pauseGame]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl gameSpeed={gameSpeed} onSpeedChange={handleSpeedChange} />
      <PlayPageContent
        isPlaying={isPlaying}
        onPlay={() => {
          if (validateAndStartGame()) {
            playGame();
          }
        }}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={(jsonFile, weightsFile) => {
          tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]))
            .then(model => {
              setTrainedModel(model);
              systemLogger.log('model', 'Modelo carregado com sucesso');
              toast({
                title: "Modelo Carregado",
                description: "O modelo foi carregado com sucesso.",
              });
            })
            .catch(error => {
              systemLogger.log('error', 'Erro ao carregar modelo', { error });
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