// GPT Engineer local script
export const systemLogger = {
  log: (type, message, data = {}) => {
    console.log(`[${type.toUpperCase()}] ${message}`, data);
  }
};

export const predictionMonitor = {
  checkStability: (predictions) => {
    if (predictions.length >= 50) {
      const recentPredictions = predictions.slice(-50);
      const averageAccuracy = recentPredictions.reduce((acc, curr) => acc + curr.accuracy, 0) / 50;
      
      if (averageAccuracy < 0.4) { // 40% threshold
        console.warn('Alerta: Baixa precisão detectada nas últimas 50 previsões');
      }
    }
  },
  
  recordPrediction: (prediction, actual, accuracy) => {
    console.log('Prediction recorded:', { prediction, actual, accuracy });
  }
};

export const performanceMonitor = {
  start: (label) => {
    console.time(label);
  },
  
  end: (label) => {
    console.timeEnd(label);
  }
};