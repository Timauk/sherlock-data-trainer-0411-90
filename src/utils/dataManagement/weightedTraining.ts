import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";

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

    // Configura o retreinamento
    await model.fit(xs, ys, {
      epochs: 10,
      batchSize: 32,
      sampleWeight: sampleWeights,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (logs) {
            addLog(`Retreinamento - Época ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}`);
          }
        }
      }
    });

    // Limpa os tensores
    xs.dispose();
    ys.dispose();
    sampleWeights.dispose();

    return model;
  } catch (error) {
    console.error('Erro no retreinamento:', error);
    throw error;
  }
};

// Configuração do intervalo de retreinamento
export const setupPeriodicRetraining = (
  model: tf.LayersModel,
  historicalData: number[][],
  dates: Date[],
  addLog: (message: string) => void,
  intervalHours: number = 24
) => {
  const interval = intervalHours * 60 * 60 * 1000; // Converte horas para milissegundos
  
  return setInterval(async () => {
    try {
      await periodicModelRetraining(model, historicalData, dates, addLog);
      addLog('Retreinamento periódico concluído com sucesso');
    } catch (error) {
      addLog(`Erro no retreinamento periódico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, interval);
};