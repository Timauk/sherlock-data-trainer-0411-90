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

    // Reshape the input data to match expected shape [*,17]
    const processedData = trainingData.map(row => {
      // Take only first 17 elements to match expected input shape
      return row.slice(0, 17);
    });

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