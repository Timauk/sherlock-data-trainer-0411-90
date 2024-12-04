import { systemLogger } from '../logging/systemLogger';

class PredictionMonitor {
  recordPrediction(prediction: number[], actual: number[], arima: number[]) {
    systemLogger.log('prediction', 'Nova previsão registrada', {
      predictionLength: prediction.length,
      actualLength: actual.length,
      arimaLength: arima.length,
      timestamp: new Date().toISOString()
    });
  }

  recordMetrics(accuracy: number, processingTime: number) {
    systemLogger.log('performance', 'Métricas de previsão', {
      accuracy,
      processingTime,
      timestamp: new Date().toISOString()
    });
  }
}

export const predictionMonitor = new PredictionMonitor();