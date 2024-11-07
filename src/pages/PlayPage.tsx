import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayPageHeader } from '@/components/PlayPageHeader';
import PlayPageContent from '@/components/PlayPageContent';
import SpeedControl from '@/components/SpeedControl';
import { loadModelFiles } from '@/utils/modelLoader';
import { loadModelWithWeights, saveModelWithWeights } from '@/utils/modelUtils';
import { Player } from '@/types/gameTypes';

const PlayPage: React.FC = () => {
  const gameLogic = useGameLogic([], null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [state, setState] = useState({
    isPlaying: false,
    progress: 0,
    gameSpeed: 1000,
    csvData: [] as number[][],
    csvDates: [] as Date[],
    trainedModel: null as tf.LayersModel | null,
    lastCloneCycle: 0
  });

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
      setState(prev => ({
        ...prev,
        csvData: data.map(d => d.bolas),
        csvDates: data.map(d => d.data)
      }));
      gameLogic.addLog("CSV carregado e processado com sucesso!");
      gameLogic.addLog(`Número de registros carregados: ${data.length}`);
    } catch (error) {
      gameLogic.addLog(`Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [gameLogic]);

  const loadModel = useCallback(async (jsonFile: File, weightsFile: File, metadataFile: File) => {
    try {
      const { model, metadata } = await loadModelFiles(jsonFile, weightsFile, metadataFile);
      setState(prev => ({ ...prev, trainedModel: model }));
      
      await saveModelWithWeights(model);
      
      gameLogic.addLog("Modelo e metadata carregados com sucesso!");
      
      if (metadata.playersData) {
        gameLogic.initializePlayers();
      }

      toast({
        title: "Modelo Carregado",
        description: "O modelo e seus metadados foram carregados com sucesso.",
      });
    } catch (error) {
      gameLogic.addLog(`Erro ao carregar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error("Detalhes do erro:", error);
      toast({
        title: "Erro ao Carregar Modelo",
        description: "Certifique-se de selecionar os três arquivos necessários: model.json, weights.bin e metadata.json",
        variant: "destructive",
      });
    }
  }, [gameLogic, toast]);

  const handleClonePlayer = useCallback((player: Player) => {
    const currentCycle = Math.floor(gameLogic.gameCount / state.csvData.length);
    
    if (currentCycle <= state.lastCloneCycle) {
      toast({
        title: "Clonagem não permitida",
        description: "Você só pode clonar uma vez por ciclo completo do CSV.",
        variant: "destructive"
      });
      return;
    }

    if (gameLogic.clonePlayer) {
      gameLogic.clonePlayer(player);
      setState(prev => ({ ...prev, lastCloneCycle: currentCycle }));
    }
  }, [gameLogic, state.csvData.length, state.lastCloneCycle, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (state.isPlaying) {
      intervalId = setInterval(() => {
        gameLogic.gameLoop();
        setState(prev => {
          const newProgress = prev.progress + (100 / state.csvData.length);
          
          if (newProgress >= 100) {
            if (!gameLogic.isManualMode) {
              gameLogic.evolveGeneration();
            }
            return {
              ...prev,
              progress: gameLogic.isInfiniteMode ? 0 : 100
            };
          }
          return {
            ...prev,
            progress: newProgress
          };
        });
      }, state.gameSpeed);
    }
    return () => clearInterval(intervalId);
  }, [state.isPlaying, state.csvData, gameLogic, state.gameSpeed]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl onSpeedChange={(speed) => setState(prev => ({ ...prev, gameSpeed: speed }))} />
      <PlayPageContent
        isPlaying={state.isPlaying}
        onPlay={() => setState(prev => ({ ...prev, isPlaying: true }))}
        onPause={() => setState(prev => ({ ...prev, isPlaying: false }))}
        onReset={() => {
          setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
          gameLogic.initializePlayers();
        }}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onCsvUpload={loadCSV}
        onModelUpload={loadModel}
        onSaveModel={() => saveModelWithWeights(state.trainedModel!)}
        progress={state.progress}
        generation={gameLogic.generation}
        gameLogic={gameLogic}
        currentCycle={Math.floor(gameLogic.gameCount / state.csvData.length)}
        lastCloneCycle={state.lastCloneCycle}
        onClonePlayer={handleClonePlayer}
      />
    </div>
  );
};

export default PlayPage;