import * as tf from '@tensorflow/tfjs';
import { updateModelWithNewData } from '@/utils/modelUtils';
import { systemLogger } from '@/utils/logging/systemLogger';

interface ModelUpdateParams {
  nextConcurso: number;
  updateInterval: number;
  trainedModel: tf.LayersModel;
  trainingData: number[][];
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>;
  addLog: (message: string) => void;
  showToast?: (title: string, description: string) => void;
}

export const handleModelUpdate = async ({
  nextConcurso,
  updateInterval,
  trainedModel,
  trainingData,
  setTrainingData,
  addLog,
  showToast
}: ModelUpdateParams) => {
  if (nextConcurso % Math.min(updateInterval, 50) === 0 && trainingData.length > 0) {
    systemLogger.log('model', 'Iniciando atualização do modelo', {
      concurso: nextConcurso,
      trainingDataSize: trainingData.length
    });

    await updateModelWithNewData(trainedModel, trainingData, addLog, showToast);
    setTrainingData([]);
    
    systemLogger.log('model', 'Modelo atualizado com sucesso');
  }
};