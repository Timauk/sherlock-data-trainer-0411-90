import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

export const generateCorePredictions = async (
  model: tf.LayersModel,
  inputData: number[]
): Promise<number[]> => {
  try {
    // Log input data for debugging
    systemLogger.log('prediction', 'Gerando predições base', {
      inputShape: inputData.length,
      inputData
    });

    // Garantir que temos exatamente 15 números
    if (inputData.length !== 15) {
      const paddedData = [...inputData];
      while (paddedData.length < 15) {
        paddedData.push(0);
      }
      inputData = paddedData.slice(0, 15);
    }

    // Normalizar os dados de entrada (0-1)
    const normalizedInput = inputData.map(num => num / 25);
    
    // Criar tensor com formato correto
    const reshapedInput = tf.tensor2d([normalizedInput]);
    
    // Gerar predição
    const prediction = model.predict(reshapedInput) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    // Limpar tensors
    reshapedInput.dispose();
    prediction.dispose();
    
    systemLogger.log('prediction', 'Predições base geradas com sucesso', {
      outputLength: probabilities.length
    });

    return probabilities;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração de predições base', { 
      error,
      inputShape: inputData.length,
      modelInputShape: model.inputs[0].shape
    });
    throw new Error('Falha ao gerar predições base: ' + error.message);
  }
};