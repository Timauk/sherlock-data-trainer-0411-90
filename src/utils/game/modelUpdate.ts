import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const updateModel = async (
  trainedModel: tf.LayersModel,
  trainingData: number[][],
  addLog: (message: string) => void
) => {
  if (!trainedModel || trainingData.length === 0) {
    systemLogger.warn('training', 'Atualização do modelo ignorada', {
      reason: !trainedModel ? 'Modelo não disponível' : 'Sem dados de treinamento',
      dataLength: trainingData.length
    });
    return trainedModel;
  }

  try {
    systemLogger.log('training', 'Iniciando atualização do modelo', {
      dataLength: trainingData.length,
      modelConfig: trainedModel.getConfig(),
      memoryBefore: tf.memory()
    });

    trainedModel.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    // Reshape the input data to match expected shape [*,17]
    const processedData = trainingData.map(row => {
      return row.slice(0, 17);
    });

    systemLogger.log('training', 'Dados processados para treinamento', {
      inputShape: [processedData.length, processedData[0].length],
      sampleData: processedData.slice(0, 2)
    });

    const xs = tf.tensor2d(processedData);
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    systemLogger.log('training', 'Tensores criados para treinamento', {
      xsShape: xs.shape,
      ysShape: ys.shape
    });

    const result = await trainedModel.fit(xs, ys, {
      epochs: 1,
      batchSize: 32,
      validationSplit: 0.1,
      callbacks: {
        onEpochBegin: async (epoch) => {
          systemLogger.log('training', `Iniciando época ${epoch + 1}`);
        },
        onEpochEnd: async (epoch, logs) => {
          systemLogger.log('training', `Época ${epoch + 1} finalizada`, { 
            loss: logs?.loss,
            accuracy: logs?.acc,
            valLoss: logs?.val_loss,
            valAccuracy: logs?.val_acc
          });
        }
      }
    });

    systemLogger.log('training', 'Treinamento finalizado', {
      finalLoss: result.history.loss?.slice(-1)[0],
      finalAccuracy: result.history.acc?.slice(-1)[0],
      memoryAfter: tf.memory(),
      modelState: {
        layers: trainedModel.layers.length,
        trainable: trainedModel.trainable,
        compiled: trainedModel.compiled
      }
    });

    xs.dispose();
    ys.dispose();

    const message = `Modelo atualizado com ${trainingData.length} novos registros.`;
    addLog(message);
    
    return trainedModel;
  } catch (error) {
    systemLogger.error('training', 'Erro ao atualizar modelo', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      dataState: {
        length: trainingData.length,
        sample: trainingData.slice(0, 1)
      },
      modelState: {
        layers: trainedModel.layers.length,
        compiled: trainedModel.compiled
      },
      tfState: {
        backend: tf.getBackend(),
        memory: tf.memory()
      }
    });
    throw error;
  }
};