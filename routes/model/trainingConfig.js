import * as tf from '@tensorflow/tfjs';
import { TrainingOptimizer } from '../../src/utils/training/trainingOptimizer';
import { systemLogger } from '../../src/utils/logging/systemLogger';

export const createTrainingConfig = (initialMetrics = null) => {
  const baseConfig = {
    epochs: 30,
    batchSize: 32,
    learningRate: 0.001,
    shuffle: true,
    validationSplit: 0.2,
    callbacks: [
      {
        onEpochBegin: async (epoch) => {
          systemLogger.log('training', `Iniciando época ${epoch + 1}`);
          
          // Log memory usage at start of epoch
          const memoryInfo = tf.memory();
          systemLogger.log('training', 'Uso de memória no início da época', {
            epoch: epoch + 1,
            numTensors: memoryInfo.numTensors,
            numDataBuffers: memoryInfo.numDataBuffers,
            byteSize: memoryInfo.numBytes / (1024 * 1024), // Convert to MB
          });
        },
        onEpochEnd: async (epoch, logs) => {
          const metrics = {
            loss: logs.loss,
            accuracy: logs.acc,
            epoch: epoch,
            modelSize: {
              numTensors: tf.memory().numTensors,
              byteSize: tf.memory().numBytes / 1024, // Convert to KB
            }
          };
          
          const analysis = TrainingOptimizer.analyzeMetrics(metrics);
          
          if (analysis.needsAdjustment) {
            systemLogger.log('training', 'Sugestões de ajuste:', {
              suggestions: analysis.suggestions,
              status: analysis.status,
              currentMetrics: metrics
            });
          }
          
          systemLogger.log('training', `Época ${epoch + 1} finalizada:`, {
            ...logs,
            modelSize: metrics.modelSize,
            qualityAssessment: {
              isGoodLoss: logs.loss < 0.5,
              isGoodAccuracy: logs.acc > 0.7
            }
          });
        },
        onBatchEnd: async (batch, logs) => {
          if (batch % 10 === 0) {
            systemLogger.log('training', `Batch ${batch} métricas:`, {
              ...logs,
              memoryUsage: {
                numTensors: tf.memory().numTensors,
                byteSize: tf.memory().numBytes / 1024 // Convert to KB
              }
            });
          }
        }
      },
      tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: 8,
        restoreBestWeights: true
      })
    ],
    metrics: ['accuracy']
  };

  if (initialMetrics) {
    return TrainingOptimizer.getOptimizedConfig(baseConfig, initialMetrics);
  }

  return baseConfig;
};

export const trainingConfig = createTrainingConfig();