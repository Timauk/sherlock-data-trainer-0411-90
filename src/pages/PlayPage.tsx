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
import { setupPeriodicRetraining } from '@/utils/dataManagement/weightedTraining';
import { Progress } from "@/components/ui/progress";

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1000);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const gameLogic = useGameLogic(csvData, trainedModel);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainingProgress, setRetrainingProgress] = useState(0);

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

  const loadModel = useCallback(async (jsonFile: File, weightsFile: File, metadataFile: File) => {
    try {
      const { model, metadata } = await loadModelFiles(jsonFile, weightsFile, metadataFile);
      setTrainedModel(model);
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

  const saveModel = useCallback(async () => {
    if (trainedModel) {
      try {
        await saveModelWithWeights(trainedModel);
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

  const playGame = useCallback(() => {
    if (!trainedModel || csvData.length === 0) {
      gameLogic.addLog("Não é possível iniciar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }
    setIsPlaying(true);
    gameLogic.addLog("Jogo iniciado.");
    gameLogic.gameLoop();
  }, [trainedModel, csvData, gameLogic]);

  const pauseGame = useCallback(() => {
    setIsPlaying(false);
    gameLogic.addLog("Jogo pausado.");
  }, [gameLogic]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    gameLogic.initializePlayers();
    gameLogic.addLog("Jogo reiniciado.");
  }, [gameLogic]);

  useEffect(() => {
    let retrainingInterval: NodeJS.Timeout;
    
    if (trainedModel && csvData.length > 0) {
      retrainingInterval = setupPeriodicRetraining(
        trainedModel,
        csvData,
        csvDates,
        gameLogic.addLog,
        () => {
          setIsPlaying(false);
          setIsRetraining(true);
          setRetrainingProgress(0);
          toast({
            title: "Iniciando Retreinamento",
            description: "O jogo será pausado para retreinar o modelo.",
            variant: "default"
          });
        },
        (improved) => {
          setIsRetraining(false);
          setRetrainingProgress(0);
          toast({
            title: improved ? "Retreinamento Concluído!" : "Retreinamento Finalizado",
            description: improved 
              ? "O modelo melhorou com o novo conhecimento!" 
              : "Nenhuma melhoria significativa detectada.",
            variant: "default"
          });
          setIsPlaying(true);
        },
        (progress) => {
          setRetrainingProgress(progress);
        }
      );
    }

    return () => {
      if (retrainingInterval) {
        clearInterval(retrainingInterval);
      }
    };
  }, [trainedModel, csvData, csvDates, gameLogic, toast]);

  return (
    <div className="p-6">
      <PlayPageHeader />
      <SpeedControl onSpeedChange={setGameSpeed} />
      {isRetraining && (
        <div className="my-4 p-4 border rounded-lg bg-secondary">
          <h3 className="text-lg font-semibold mb-2">Retreinando Modelo</h3>
          <Progress value={retrainingProgress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Progresso: {Math.round(retrainingProgress)}%
          </p>
        </div>
      )}
      <PlayPageContent
        isPlaying={isPlaying && !isRetraining}
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
