import { systemLogger } from '../logging/systemLogger';

interface TrainingMetrics {
  loss: number;
  accuracy: number;
  epoch: number;
}

export class TrainingOptimizer {
  private static readonly LOSS_THRESHOLD = 0.5;
  private static readonly ACCURACY_THRESHOLD = 0.7;
  
  static analyzeMetrics(metrics: TrainingMetrics) {
    const suggestions: string[] = [];
    
    // Analisa loss
    if (metrics.loss > this.LOSS_THRESHOLD) {
      if (metrics.epoch < 10) {
        suggestions.push('Aumentar número de épocas para pelo menos 50');
      }
      suggestions.push('Reduzir learning rate para 0.0005');
      suggestions.push('Aumentar batch size para 64');
    }
    
    // Analisa accuracy
    if (metrics.accuracy < this.ACCURACY_THRESHOLD) {
      suggestions.push('Adicionar mais dados de treinamento');
      suggestions.push('Aumentar complexidade do modelo (mais unidades nas camadas)');
      suggestions.push('Verificar qualidade dos dados de entrada');
    }
    
    return {
      needsAdjustment: suggestions.length > 0,
      suggestions,
      status: this.getTrainingStatus(metrics)
    };
  }
  
  private static getTrainingStatus(metrics: TrainingMetrics) {
    if (metrics.loss <= this.LOSS_THRESHOLD && metrics.accuracy >= this.ACCURACY_THRESHOLD) {
      return 'optimal';
    }
    if (metrics.loss > 1.0 || metrics.accuracy < 0.3) {
      return 'critical';
    }
    return 'needs_adjustment';
  }
  
  static getOptimizedConfig(currentConfig: any, metrics: TrainingMetrics) {
    const { needsAdjustment, status } = this.analyzeMetrics(metrics);
    
    if (!needsAdjustment) return currentConfig;
    
    return {
      ...currentConfig,
      batchSize: status === 'critical' ? 64 : currentConfig.batchSize,
      epochs: status === 'critical' ? 50 : currentConfig.epochs,
      learningRate: status === 'critical' ? 0.0005 : currentConfig.learningRate,
      validationSplit: 0.2
    };
  }
}