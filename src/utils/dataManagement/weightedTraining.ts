import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

// Função para calcular pesos baseados na idade dos dados
export const calculateDataWeights = (dates: Date[]): number[] => {
  const now = new Date();
  const maxAge = Math.max(...dates.map(date => now.getTime() - date.getTime()));
  
  return dates.map(date => {
    const age = now.getTime() - date.getTime();
    // Dados mais recentes têm peso maior (0.5 a 1.0)
    return 0.5 + (0.5 * (1 - age / maxAge));
  });
};

// Função para retreinar o modelo periodicamente
export const periodicModelRetraining = async (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void
): Promise<tf.LayersModel> => {
  try {
    // Calcula pesos para cada entrada de dados
    const weights = calculateDataWeights(dates);
    
    // Prepara os dados de treinamento
    const xs = tf.tensor2d(historicalData.map(data => data.slice(0, -15)));
    const ys = tf.tensor2d(historicalData.map(data => data.slice(-15)));
    const sampleWeights = tf.tensor1d(weights);

    // Configura o retreinamento com early stopping
    await model.fit(xs, ys, {
      epochs: 25, // Reduzido para evitar overfitting
      batchSize: 32,
      sampleWeight: sampleWeights,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 5,
          restoreBestWeights: true
        }),
        {
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              const message = `Retreinamento - Época ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Val Loss = ${logs.val_loss?.toFixed(4)}`;
              addLog(message);
              systemLogger.log('model', message);
            }
          }
        }
      ]
    });

    // Limpa os tensores
    xs.dispose();
    ys.dispose();
    sampleWeights.dispose();

    return model;
  } catch (error) {
    const errorMessage = `Erro no retreinamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    systemLogger.log('system', errorMessage);
    throw error;
  }
};

// Configuração do intervalo de retreinamento
export const setupPeriodicRetraining = (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void,
  intervalHours: number = 12 // Reduzido para 12 horas
) => {
  const interval = intervalHours * 60 * 60 * 1000;
  
  return setInterval(async () => {
    try {
      const beforeLoss = await evaluateModel(model, historicalData);
      await periodicModelRetraining(model, historicalData, dates, addLog);
      const afterLoss = await evaluateModel(model, historicalData);
      
      const improvementMessage = `Melhoria no modelo: Loss antes = ${beforeLoss.toFixed(4)}, Loss depois = ${afterLoss.toFixed(4)}`;
      addLog(improvementMessage);
      systemLogger.log('model', improvementMessage);
    } catch (error) {
      const errorMessage = `Erro no retreinamento periódico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      addLog(errorMessage);
      systemLogger.log('system', errorMessage);
    }
  }, interval);
};

// Nova função para avaliar o modelo
async function evaluateModel(model: tf.LayersModel, data: number[][]): Promise<number> {
  const xs = tf.tensor2d(data.map(d => d.slice(0, -15)));
  const ys = tf.tensor2d(data.map(d => d.slice(-15)));
  
  const result = await model.evaluate(xs, ys) as tf.Tensor;
  const loss = (await result.data())[0];
  
  xs.dispose();
  ys.dispose();
  result.dispose();
  
  return loss;
}