export const trainingConfig = {
  epochs: 50,
  batchSize: 32,
  validationSplit: 0.2,
  shuffle: true,
  callbacks: [
    {
      onEpochBegin: async (epoch) => {
        console.log(`Iniciando época ${epoch + 1}`);
      },
      onEpochEnd: (epoch, logs) => {
        if (logs) {
          console.log(`Época ${epoch + 1} métricas:`, {
            loss: logs.loss.toFixed(4),
            accuracy: logs.acc.toFixed(4),
            val_loss: logs.val_loss?.toFixed(4),
            val_acc: logs.val_acc?.toFixed(4)
          });
        }
      }
    }
  ]
};