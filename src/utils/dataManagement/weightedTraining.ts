import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';
import { useToast } from "@/hooks/use-toast";

// Função para calcular pesos baseados na idade dos dados
export const calculateDataWeights = (dates: Date[]): number[] => {
  const now = new Date();
  const maxAge = Math.max(...dates.map(date => now.getTime() - date.getTime()));
  
  return dates.map(date => {
    const age = now.getTime() - date.getTime();
    return 0.5 + (0.5 * (1 - age / maxAge));
  });
};

// Função para retreinar o modelo periodicamente
export const periodicModelRetraining = async (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void,
  onProgress?: (progress: number) => void
): Promise<{ model: tf.LayersModel; improved: boolean }> => {
  try {
    const weights = calculateDataWeights(dates);
    const xs = tf.tensor2d(historicalData.map(data => data.slice(0, -15)));
    const ys = tf.tensor2d(historicalData.map(data => data.slice(-15)));
    const sampleWeights = tf.tensor1d(weights);

    const initialLoss = await evaluateModel(model, xs, ys);
    let bestLoss = initialLoss;
    let improved = false;

    await model.fit(xs, ys, {
      epochs: 25,
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
          onEpochEnd: async (epoch, logs) => {
            if (logs) {
              const progress = ((epoch + 1) / 25) * 100;
              onProgress?.(progress);
              
              const message = `Retreinamento - Época ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Val Loss = ${logs.val_loss?.toFixed(4)}`;
              addLog(message);
              systemLogger.log('model', message);

              if (logs.val_loss && logs.val_loss < bestLoss) {
                bestLoss = logs.val_loss;
                improved = true;
              }
            }
          }
        }
      ]
    });

    xs.dispose();
    ys.dispose();
    sampleWeights.dispose();

    return { model, improved };
  } catch (error) {
    const errorMessage = `Erro no retreinamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    systemLogger.log('system', errorMessage);
    throw error;
  }
};

// Configuração do intervalo de retreinamento (15 minutos)
export const setupPeriodicRetraining = (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void,
  onRetrainingStart: () => void,
  onRetrainingComplete: (improved: boolean) => void,
  onProgress: (progress: number) => void
) => {
  const interval = 15 * 60 * 1000; // 15 minutos
  
  return setInterval(async () => {
    try {
      onRetrainingStart();
      const { model: updatedModel, improved } = await periodicModelRetraining(
        model, 
        historicalData, 
        dates, 
        addLog,
        onProgress
      );
      
      onRetrainingComplete(improved);

      if (improved) {
        const message = "Modelo melhorou com o retreinamento!";
        addLog(message);
        systemLogger.log('model', message, { improved: true });
      } else {
        const message = "Nada de novo aprendido no retreinamento.";
        addLog(message);
        systemLogger.log('model', message, { improved: false });
      }
    } catch (error) {
      const errorMessage = `Erro no retreinamento periódico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      addLog(errorMessage);
      systemLogger.log('system', errorMessage);
      onRetrainingComplete(false);
    }
  }, interval);
};

async function evaluateModel(
  model: tf.LayersModel, 
  xs: tf.Tensor, 
  ys: tf.Tensor
): Promise<number> {
  const result = await model.evaluate(xs, ys) as tf.Tensor;
  const loss = (await result.data())[0];
  result.dispose();
  return loss;
}