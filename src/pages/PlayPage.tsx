import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useGameControls } from '@/hooks/useGameControls';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';
import GameInitializer from '@/components/GameInitializer';
import { systemLogger } from '@/utils/logging/systemLogger';

const PlayPage: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();

  const gameLogic = useGameLogic(csvData, trainedModel);

  const handleSpeedChange = (value: number[]) => {
    setGameSpeed(value[0]);
  };

  const handleCsvUpload = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      
      const data = lines.map(line => {
        const values = line.split(',');
        return values.slice(2).map(Number);
      });

      setCsvData(data);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading CSV:', error);
    }
  };

  const handleModelUpload = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      setTrainedModel(model);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying) {
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
      <GameInitializer
        csvData={csvData}
        setCsvData={setCsvData}
        setCsvDates={setCsvDates}
        setTrainedModel={setTrainedModel}
        setIsDataLoaded={setIsDataLoaded}
        gameLogic={gameLogic}
      />
      <SpeedControl gameSpeed={gameSpeed} onSpeedChange={handleSpeedChange} />
      <PlayPageContent
        isPlaying={isPlaying}
        onPlay={playGame}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={handleCsvUpload}
        onModelUpload={handleModelUpload}
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