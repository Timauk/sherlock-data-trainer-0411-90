import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { WorkerPool } from '@/utils/performance/workerPool';
import { summarizeHistoricalData } from '@/utils/dataManagement/dataSummarization';
import { createEnsembleModels, trainEnsemble } from '@/utils/aiModel/ensembleLearning';
import * as tf from '@tensorflow/tfjs';

export const useModelTraining = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const workerPool = new WorkerPool();

  const startTraining = useCallback(async (
    historicalData: number[][],
    dates: Date[],
    lunarData: any[]
  ) => {
    try {
      setIsTraining(true);
      setProgress(0);

      // Sumarização de dados históricos
      const summaries = summarizeHistoricalData(historicalData, dates);
      setProgress(20);

      // Criação dos modelos ensemble
      const models = await createEnsembleModels();
      setProgress(40);

      // Treinamento dos modelos
      await trainEnsemble(models, historicalData, summaries, lunarData);
      setProgress(90);

      // Salva os modelos
      await Promise.all([
        models.seasonal.save('indexeddb://seasonal-model'),
        models.frequency.save('indexeddb://frequency-model'),
        models.lunar.save('indexeddb://lunar-model'),
        models.sequential.save('indexeddb://sequential-model')
      ]);

      setProgress(100);
      toast({
        title: "Treinamento Concluído",
        description: "Os modelos foram treinados e salvos com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
      workerPool.terminate();
    }
  }, [toast]);

  return {
    isTraining,
    progress,
    startTraining
  };
};