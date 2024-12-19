import { useState } from 'react';
import { TrainingLog } from '../types/training';

export const useTrainingState = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<any>(null);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState("32");
  const [validationMetrics, setValidationMetrics] = useState<{accuracy: number, loss: number}[]>([]);

  return {
    trainingData,
    setTrainingData,
    dates,
    setDates,
    isTraining,
    setIsTraining,
    progress,
    setProgress,
    model,
    setModel,
    trainingLogs,
    setTrainingLogs,
    epochs,
    setEpochs,
    batchSize,
    setBatchSize,
    validationMetrics,
    setValidationMetrics
  };
};