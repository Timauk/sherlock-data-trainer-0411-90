interface PredictionMetric {
  timestamp: number;
  prediction: number[];
  actual: number[];
  matches: number;
  confidence: number;
  patterns: any;
}

class PredictionMetricsSystem {
  private metrics: PredictionMetric[] = [];
  private readonly maxMetrics = 1000;

  recordPrediction(
    prediction: number[],
    actual: number[],
    confidence: number,
    patterns?: any
  ) {
    const matches = prediction.filter(n => actual.includes(n)).length;
    
    this.metrics.push({
      timestamp: Date.now(),
      prediction,
      actual,
      matches,
      confidence,
      patterns
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetricsSummary() {
    const recentMetrics = this.metrics.slice(-10);
    const totalPredictions = this.metrics.length;
    
    if (totalPredictions === 0) {
      return {
        averageAccuracy: 0,
        successRate: 0,
        totalPredictions: 0,
        recentMetrics: []
      };
    }

    const accuracySum = this.metrics.reduce((sum, m) => sum + (m.matches / 15), 0);
    const successCount = this.metrics.filter(m => m.matches >= 11).length;

    return {
      averageAccuracy: accuracySum / totalPredictions,
      successRate: successCount / totalPredictions,
      totalPredictions,
      recentMetrics
    };
  }

  getPatternAnalysis() {
    return this.metrics
      .filter(m => m.patterns)
      .reduce((analysis, metric) => {
        // Implementar análise de padrões bem-sucedidos
        return analysis;
      }, {});
  }

  getConfidenceCorrelation() {
    if (this.metrics.length < 2) return 0;
    
    const confidences = this.metrics.map(m => m.confidence);
    const accuracies = this.metrics.map(m => m.matches / 15);
    
    return this.calculateCorrelation(confidences, accuracies);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sum1 = x.reduce((a, b) => a + b);
    const sum2 = y.reduce((a, b) => a + b);
    const sum1Sq = x.reduce((a, b) => a + b * b);
    const sum2Sq = y.reduce((a, b) => a + b * b);
    const pSum = x.map((x, i) => x * y[i]).reduce((a, b) => a + b);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt(
      (sum1Sq - sum1 * sum1 / n) *
      (sum2Sq - sum2 * sum2 / n)
    );
    
    return num / den;
  }
}

export const predictionMetrics = new PredictionMetricsSystem();