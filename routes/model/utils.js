import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../src/utils/logging/systemLogger';

let globalModel = null;
let totalSamples = 0;

export async function validateModelArchitecture(model) {
  try {
    systemLogger.log('model', 'Iniciando validação da arquitetura do modelo', {
      layersCount: model.layers.length,
      inputShape: model.inputs[0].shape,
      outputShape: model.outputs[0].shape
    });

    // Validar shape de entrada
    const inputShape = model.inputs[0].shape[1];
    if (inputShape !== 13057) {
      throw new Error(`Input shape inválido: esperado 13057, recebido ${inputShape}`);
    }

    // Validar shape de saída
    const outputShape = model.outputs[0].shape[1];
    if (outputShape !== 15) {
      throw new Error(`Output shape inválido: esperado 15, recebido ${outputShape}`);
    }

    // Teste com dados dummy
    const testInput = tf.zeros([1, 13057]);
    const testOutput = model.predict(testInput);
    
    systemLogger.log('model', 'Teste de predição realizado', {
      inputShape: testInput.shape,
      outputShape: testOutput.shape,
      outputValues: Array.from(testOutput.dataSync()).slice(0, 5)
    });

    testInput.dispose();
    testOutput.dispose();

    return true;
  } catch (error) {
    systemLogger.error('model', 'Erro na validação do modelo', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

export async function getOrCreateModel() {
  try {
    if (!globalModel) {
      systemLogger.log('model', 'Iniciando criação do modelo global', {
        backend: tf.getBackend(),
        memory: tf.memory()
      });

      globalModel = await createModelArchitecture();
      
      const isValid = await validateModelArchitecture(globalModel);
      if (!isValid) {
        throw new Error('Falha na validação da arquitetura do modelo');
      }
    }
    
    return globalModel;
  } catch (error) {
    systemLogger.error('model', 'Erro ao criar/obter modelo:', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export { totalSamples };
