import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../utils/logging/systemLogger';
import { createEnhancedModel } from '../utils/training/modelArchitecture';
import { performCrossValidation } from '../utils/training/crossValidation';
import { extractFeatures } from '../utils/features/featureEngineering';
import { useToast } from './use-toast';
import type { TrainingLog } from '../types/training';

export const useTrainingLogic = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<{accuracy: number, loss: number}[]>([]);
  const { toast } = useToast();

  const trainModel = async (
    trainingData: number[][],
    dates: Date[],
    epochs: number,
    batchSize: string,
    learningRate: number,
    validationSplit: number,
    optimizer: string,
    useEarlyStopping: boolean
  ) => {
    if (!trainingData.length) {
      systemLogger.warn('training', 'Tentativa de treinar sem dados');
      toast({
        title: "Erro",
        description: "Nenhum dado de treinamento fornecido",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setTrainingLogs([]);

    try {
      systemLogger.log('training', 'Iniciando treinamento do modelo', {
        epochs,
        batchSize,
        learningRate,
        validationSplit,
        useEarlyStopping,
        dataSize: trainingData.length,
        timestamp: new Date().toISOString()
      });

      // Verificar se o TensorFlow está pronto
      await tf.ready();
      
      const newModel = createEnhancedModel(optimizer, learningRate);
      
      // Log do formato dos dados
      systemLogger.log('training', 'Formato dos dados de entrada', {
        primeiraAmostra: trainingData[0],
        tamanhoAmostra: trainingData[0].length,
        totalAmostras: trainingData.length
      });
      
      const features = trainingData.map((numbers, i) => {
        try {
          const allFeatures = extractFeatures(numbers, dates[i], trainingData);
          return [
            ...allFeatures.baseFeatures,
            ...allFeatures.temporalFeatures,
            ...allFeatures.lunarFeatures,
            ...allFeatures.statisticalFeatures
          ];
        } catch (error) {
          systemLogger.error('training', 'Erro ao extrair features', { 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            amostra: numbers,
            indice: i 
          });
          throw error;
        }
      });

      const labels = trainingData.map(numbers => numbers.map(n => n / 25));

      // Validação cruzada
      const metrics = await performCrossValidation(newModel, features, labels);
      setValidationMetrics(metrics);

      // Converter para tensores
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels);

      try {
        const result = await newModel.fit(xs, ys, {
          epochs: epochs,
          batchSize: parseInt(batchSize),
          validationSplit: validationSplit,
          callbacks: [
            ...(useEarlyStopping ? [
              tf.callbacks.earlyStopping({
                monitor: 'val_loss',
                patience: 5
              })
            ] : []),
            {
              onEpochBegin: (epoch) => {
                systemLogger.log('training', `Iniciando época ${epoch + 1}`, {
                  timestamp: new Date().toISOString(),
                  memoriaUsada: tf.memory()
                });
              },
              onEpochEnd: (epoch, logs) => {
                const progress = ((epoch + 1) / epochs) * 100;
                setProgress(progress);
                
                if (logs) {
                  const convergenceRate = epoch > 0 && trainingLogs.length > 0 ? 
                    (trainingLogs[trainingLogs.length - 1].loss - logs.loss) / trainingLogs[trainingLogs.length - 1].loss : 
                    0;

                  setTrainingLogs(currentLogs => [...currentLogs, {
                    epoch: epoch + 1,
                    loss: logs.loss,
                    val_loss: logs.val_loss,
                    accuracy: logs.acc,
                    val_accuracy: logs.val_acc,
                    convergenceRate
                  }]);
                  
                  systemLogger.log('training', `Época ${epoch + 1} finalizada`, { 
                    ...logs,
                    convergenceRate,
                    progress: `${progress.toFixed(2)}%`,
                    timeElapsed: new Date().toISOString()
                  });
                }
              }
            }
          ]
        });

        setModel(newModel);
        
        systemLogger.log('training', 'Treinamento concluído com sucesso', {
          finalLoss: result.history.loss[result.history.loss.length - 1],
          totalEpochs: epochs,
          finalAccuracy: result.history.acc[result.history.acc.length - 1],
          timestamp: new Date().toISOString()
        });

        toast({
          title: "Sucesso",
          description: "Modelo treinado com sucesso!",
          variant: "default"
        });
      } finally {
        // Limpar tensores
        xs.dispose();
        ys.dispose();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      systemLogger.error('training', 'Erro detalhado no treinamento', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        modelState: model ? 'existente' : 'null',
        memoria: tf.memory()
      });
      
      toast({
        title: "Erro no Treinamento",
        description: `Falha ao treinar modelo: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  return {
    isTraining,
    progress,
    model,
    trainingLogs,
    validationMetrics,
    trainModel
  };
};