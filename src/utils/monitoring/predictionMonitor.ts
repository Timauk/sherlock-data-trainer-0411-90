import { predictionMonitor as localMonitor } from '../gptengineer';

export const predictionMonitor = {
  ...localMonitor,
  checkPredictionsConsistency: (predictions) => {
    if (predictions.length < 2) return;

    const consecutiveHighAccuracy = predictions.filter(pred => pred.accuracy >= 0.5).length;
    if (consecutiveHighAccuracy > 5) {
      console.warn('Alerta: Consistência alta nas previsões detectada');
    }
  },
  logPrediction: (prediction, actual, accuracy) => {
    console.log('Prediction details:', { prediction, actual, accuracy });
  }
};
