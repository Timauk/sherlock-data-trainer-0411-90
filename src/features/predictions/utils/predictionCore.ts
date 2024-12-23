import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '@/utils/logging/systemLogger';

export const generateCorePredictions = async (
  model: tf.LayersModel,
  inputData: number[]
): Promise<number[]> => {
  try {
    // Log input data for debugging
    systemLogger.log('prediction', 'Generating core predictions', {
      inputShape: inputData.length,
      inputData
    });

    // Ensure input data is properly formatted for the model
    const reshapedInput = tf.tensor2d([inputData]);
    
    // Get model prediction
    const prediction = model.predict(reshapedInput) as tf.Tensor;
    const probabilities = Array.from(await prediction.data());
    
    // Clean up tensors
    reshapedInput.dispose();
    prediction.dispose();
    
    systemLogger.log('prediction', 'Core predictions generated successfully', {
      outputLength: probabilities.length
    });

    return probabilities;
  } catch (error) {
    systemLogger.error('prediction', 'Error in core prediction generation', { error });
    throw new Error('Failed to generate core predictions: ' + error.message);
  }
};