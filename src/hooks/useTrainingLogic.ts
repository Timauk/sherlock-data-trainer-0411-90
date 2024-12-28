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

      const newModel = createEnhancedModel(optimizer, learningRate);
      
      const features = trainingData.map((numbers, i) => {
        const allFeatures = extractFeatures(numbers, dates[i], trainingData);
        return [
          ...allFeatures.baseFeatures,
          ...allFeatures.temporalFeatures,
          ...allFeatures.lunarFeatures,
          ...allFeatures.statisticalFeatures
        ];
      });

      const labels = trainingData.map(numbers => numbers.map(n => n / 25));

      const metrics = await performCrossValidation(newModel, features, labels);
      setValidationMetrics(metrics);

      await newModel.fit(tf.tensor2d(features), tf.tensor2d(labels), {
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
                timestamp: new Date().toISOString()
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
      
      systemLogger.log('training', 'Treinamento concluído', {
        finalLoss: trainingLogs[trainingLogs.length - 1]?.loss,
        totalEpochs: epochs,
        finalAccuracy: trainingLogs[trainingLogs.length - 1]?.accuracy,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Treinamento Concluído",
        description: "Modelo treinado com sucesso!"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      systemLogger.error('training', 'Erro detalhado no treinamento', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
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