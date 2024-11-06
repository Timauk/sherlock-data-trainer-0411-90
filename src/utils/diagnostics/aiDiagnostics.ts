import { systemLogger } from '../logging/systemLogger';
import { learningFeedbackLoop } from '../learning/feedbackLoop';
import { modelMonitoring } from '../monitoring/modelMonitoring';

export interface AIDiagnosticResult {
  accuracy: number;
  samples: number;
  confidence: number;
  trend: number;
  stability: number;
}

export const getAIDiagnostics = (): AIDiagnosticResult => {
  const metrics = modelMonitoring.getMetricsSummary();
  const feedback = learningFeedbackLoop.getMetricsSummary();
  
  const result = {
    accuracy: metrics.avgAccuracy,
    samples: metrics.totalSamples,
    confidence: feedback.averageAccuracy,
    trend: feedback.totalReward / (feedback.totalPatterns || 1),
    stability: feedback.averagePatternDepth
  };

  systemLogger.log('diagnostic', 'AI Diagnostic completed', result);
  return result;
};