interface PredictionMetrics {
  accuracy: number;
  arimaAccuracy: number;
  timestamp: number;
  cycleNumber: number;
}

class PredictionMonitor {
  private static instance: PredictionMonitor;
  private metrics: PredictionMetrics[] = [];
  private cycleCount: number = 0;
  
  private constructor() {}
  
  static getInstance(): PredictionMonitor {
    if (!PredictionMonitor.instance) {
      PredictionMonitor.instance = new PredictionMonitor();
    }
    return PredictionMonitor.instance;
  }
  
  recordPrediction(prediction: number[], actual: number[], arimaPredictor: number[]) {
    const matches = prediction.filter(num => actual.includes(num)).length;
    const arimaMatches = arimaPredictor.filter(num => actual.includes(num)).length;
    
    this.metrics.push({
      accuracy: matches / 15,
      arimaAccuracy: arimaMatches / 15,
      timestamp: Date.now(),
      cycleNumber: ++this.cycleCount
    });
    
    // Manter apenas os últimos 100 registros
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Monitorar estabilidade
    this.checkStability();
  }
  
  private checkStability() {
    if (this.metrics.length < 50) return;
    
    const recentMetrics = this.metrics.slice(-50);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.accuracy, 0) / 50;
    const avgArimaAccuracy = recentMetrics.reduce((sum, m) => sum + m.arimaAccuracy, 0) / 50;
    
    if (avgAccuracy < 0.2 || avgArimaAccuracy < 0.2) {
      console.warn('Alerta: Baixa precisão detectada nas últimas 50 previsões');
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  getCycleCount() {
    return this.cycleCount;
  }
  
  reset() {
    this.metrics = [];
    this.cycleCount = 0;
  }
}

export const predictionMonitor = PredictionMonitor.getInstance();