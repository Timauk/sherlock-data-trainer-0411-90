import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameControls } from '@/hooks/useGameControls';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';
import { ModelInitializer } from '@/utils/tensorflow/modelInitializer';
import { systemLogger } from '@/utils/logging/systemLogger';
import { validateSystemState } from '@/utils/validation/systemValidation';

const PlayPage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();

  const gameLogic = useGameLogic(csvData, trainedModel);

  const initializeNeuralNetwork = async () => {
    try {
      const model = await ModelInitializer.initializeModel();
      
      const xs = tf.tensor2d(csvData.map(row => row.slice(0, 15)));
      const ys = tf.tensor2d(csvData.map(row => row.slice(-15)));
      
      await model.fit(xs, ys, {
        epochs: 10,
        batchSize: 32,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            systemLogger.log('training', `Época ${epoch + 1}`, { loss: logs?.loss });
          }
        }
      });

      setTrainedModel(model);
      setIsDataLoaded(true);
      gameLogic.initializeGameData();
      
      toast({
        title: "Modelo Neural Treinado",
        description: "O modelo foi treinado com sucesso e está pronto para iniciar o jogo.",
      });

      xs.dispose();
      ys.dispose();
      
    } catch (error) {
      systemLogger.error('training', 'Erro ao inicializar rede neural', { error });
      toast({
        title: "Erro no Treinamento",
        description: "Ocorreu um erro ao treinar o modelo neural. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const loadCSV = async (file: File) => {
    try {
      systemLogger.log('csv', 'Iniciando carregamento do CSV', { fileName: file.name });
      const text = await file.text();
      
      const lines = text.trim().split('\n').slice(1);
      systemLogger.log('csv', 'Processando linhas do CSV', { totalLines: lines.length });
      
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });

      const isValidNumbers = data.every(d => 
        d.bolas.length === 15 && 
        d.bolas.every(n => n >= 1 && n <= 25)
      );

      if (!isValidNumbers) {
        systemLogger.error('csv', 'Números inválidos encontrados no CSV');
        throw new Error('Números inválidos encontrados no CSV');
      }

      systemLogger.log('csv', 'Dados processados com sucesso', {
        totalRegistros: data.length,
        primeiraLinha: data[0],
        ultimaLinha: data[data.length - 1],
        amostras: data.slice(0, 5).map(d => d.bolas)
      });

      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));

      toast({
        title: "Dados Carregados",
        description: `${data.length} registros foram carregados. Iniciando treinamento...`,
      });
    } catch (error) {
      systemLogger.error('csv', 'Erro ao carregar CSV', { 
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Erro ao Carregar Dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const onModelUpload = async (jsonFile: File, weightsFile: File) => {
    try {
      systemLogger.log('model', 'Iniciando carregamento do modelo', {
        jsonFileName: jsonFile.name,
        weightsFileName: weightsFile.name
      });

      const model = await ModelInitializer.initializeModel();
      systemLogger.log('model', 'Modelo base inicializado', {
        layers: model.layers.length,
        config: model.getConfig()
      });
      
      try {
        const loadedModel = await tf.loadLayersModel(tf.io.browserFiles(
          [jsonFile, weightsFile]
        ));
        
        systemLogger.log('model', 'Modelo carregado com sucesso', {
          loadedLayers: loadedModel.layers.length,
          weightsCount: loadedModel.getWeights().length,
          memoryInfo: tf.memory()
        });
        
        const weights = loadedModel.getWeights();
        model.setWeights(weights);
        
        setTrainedModel(model);
        toast({
          title: "Modelo Carregado",
          description: "O modelo foi carregado com sucesso.",
        });
      } catch (loadError) {
        systemLogger.error('model', 'Erro ao carregar pesos do modelo', { 
          error: loadError,
          stack: loadError instanceof Error ? loadError.stack : undefined
        });
        throw loadError;
      }
    } catch (error) {
      systemLogger.error('model', 'Erro ao carregar modelo', { 
        error,
        stack: error instanceof Error ? error.stack : undefined,
        tfBackend: tf.getBackend(),
        memoryInfo: tf.memory()
      });
      toast({
        title: "Erro ao Carregar",
        description: "Ocorreu um erro ao carregar o modelo.",
        variant: "destructive"
      });
    }
  };

  const validateAndStartGame = () => {
    if (!isDataLoaded) {
      toast({
        title: "Aguarde",
        description: "O modelo neural ainda está sendo treinado...",
        variant: "destructive"
      });
      return false;
    }

    const validation = validateSystemState(
      csvData,
      gameLogic.champion,
      trainedModel,
      gameLogic.numbers
    );

    if (!validation.isValid) {
      toast({
        title: "Não é possível iniciar o jogo",
        description: `Itens faltantes: ${validation.missingItems.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    systemLogger.log('game', 'Jogo iniciado com sucesso', {
      csvRegistros: csvData.length,
      modeloCarregado: !!trainedModel,
      campeaoId: gameLogic.champion?.player?.id
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
        onModelUpload={onModelUpload}
        onSaveModel={() => {
          if (trainedModel) {
            trainedModel.save('downloads://modelo-atual');
          }
        }}
        progress={progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
        isDataLoaded={isDataLoaded}
      />
    </div>
  );
};

export default PlayPage;
