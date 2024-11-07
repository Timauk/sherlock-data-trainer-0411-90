import * as tf from '@tensorflow/tfjs';

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

    await trainedModel.fit(xs, ys, {
      epochs: 1,
      batchSize: 32,
      validationSplit: 0.1
    });

    xs.dispose();
    ys.dispose();

    const message = `Modelo atualizado com ${trainingData.length} novos registros.`;
    addLog(message);
    
    if (showToast) {
      showToast("Modelo Atualizado", "O modelo foi atualizado com sucesso com os novos dados.");
    }

    return trainedModel;
  } catch (error) {
    const errorMessage = `Erro ao atualizar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
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