import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logging/systemLogger';

export const updateModelWithNewData = async (
  trainedModel: tf.LayersModel,
  trainingData: number[][],
  addLog: (message: string) => void,
  showToast?: (title: string, description: string) => void
) => {
  if (!trainedModel || trainingData.length === 0) return trainedModel;

  try {
    trainedModel.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    const processedData = trainingData.map(row => row.slice(0, 17));
    const xs = tf.tensor2d(processedData);
    const ys = tf.tensor2d(trainingData.map(row => row.slice(-15)));

    systemLogger.log('training', '🔄 Iniciando retreino do modelo...', {
      amostras: trainingData.length
    });

    const result = await trainedModel.fit(xs, ys, {
      epochs: 50,  // Alterado de 1 para 50 épocas
      batchSize: 32,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (logs) {
            const lossValue = typeof logs.loss === 'number' ? logs.loss : (logs.loss as tf.Tensor).dataSync()[0];
            systemLogger.log('training', `📊 Retreino - Época ${epoch + 1}`, {
              loss: lossValue.toFixed(4),
              accuracy: logs.acc ? (typeof logs.acc === 'number' ? logs.acc.toFixed(4) : 'N/A') : 'N/A'
            });
          }
        }
      }
    });

    xs.dispose();
    ys.dispose();

    const finalLoss = typeof result.history.loss[0] === 'number' 
      ? result.history.loss[0] 
      : (result.history.loss[0] as tf.Tensor).dataSync()[0];

    const message = `✅ Modelo retreinado com ${trainingData.length} novos registros. Loss: ${finalLoss.toFixed(4)}`;
    systemLogger.log('training', message, { history: result.history });
    addLog(message);
    
    if (showToast) {
      showToast("Modelo Atualizado", "O modelo foi retreinado com sucesso com os novos dados.");
    }

    return trainedModel;
  } catch (error) {
    const errorMessage = `❌ Erro ao atualizar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    systemLogger.log('training', errorMessage, { error }, 'error');
    addLog(errorMessage);
    console.error("Detalhes do erro:", error);
    return trainedModel;
  }
};

export const saveModelWithWeights = async (
  model: tf.LayersModel,
  name: string = 'modelo-atual'
): Promise<void> => {
  try {
    // Save model with weights in one file
    await model.save(`downloads://${name}`);
    
    // Also save to IndexedDB for backup
    await model.save(`indexeddb://${name}`);
  } catch (error) {
    console.error('Erro ao salvar modelo:', error);
    throw error;
  }
};

export const loadModelWithWeights = async (
  name: string = 'modelo-atual'
): Promise<tf.LayersModel> => {
  try {
    // Try loading from IndexedDB first
    const model = await tf.loadLayersModel(`indexeddb://${name}`);
    return model;
  } catch (error) {
    console.error('Erro ao carregar modelo do IndexedDB:', error);
    throw new Error(`Falha ao carregar modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};