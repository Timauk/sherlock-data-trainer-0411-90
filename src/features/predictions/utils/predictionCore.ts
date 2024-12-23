import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';
import { extractFeatures } from '@/utils/features/featureEngineering';

export const generateCorePredictions = async (
  model: tf.LayersModel,
  inputData: number[]
): Promise<number[]> => {
  try {
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

    // Enriquecer dados com features adicionais (mesmo processo usado no treino)
    const currentDate = new Date();
    const historicalData = [inputData]; // Usar apenas o dado atual como histórico
    const features = extractFeatures(inputData, currentDate, historicalData);
    
    // Combinar todas as features em um único array
    const enrichedInput = [
      ...features.baseFeatures,
      ...features.temporalFeatures,
      ...features.lunarFeatures,
      ...features.statisticalFeatures
    ];
    
    // Criar tensor com formato correto [1, 22]
    const reshapedInput = tf.tensor2d([enrichedInput]);
    
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