export const trainingConfig = {
  epochs: 30,
  batchSize: 16,
  shuffle: true,
  validationSplit: 0.2,
  callbacks: [
    {
      onEpochBegin: async (epoch) => {
        console.log('Iniciando época', epoch + 1);
      },
      onEpochEnd: async (epoch, logs) => {
        console.log('Época', epoch + 1, 'finalizada:', logs);
      },
      onBatchEnd: async (batch, logs) => {
        if (batch % 10 === 0) {
          console.log('Batch', batch, 'métricas:', logs);
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