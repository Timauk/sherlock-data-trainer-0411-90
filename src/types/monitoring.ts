export interface SystemStatus {
  healthy: boolean;
  health: number;
  alerts: number;
}

export interface ModelMetrics {
  accuracy: number;
  confidence: number;
  samples: number;
  adaptability: number;
}

export interface SpecializedModelsStatus {
  active: boolean;
  activeCount: number;
  totalCount: number;
  performance: {
    seasonal: ModelMetrics;
    frequency: ModelMetrics;
    lunar: ModelMetrics;
    sequential: ModelMetrics;
  };
}

export interface DataQualityMetrics {
  quality: number;
  completeness: number;
}

export interface AnalysisStatus {
  active: boolean;
  activeAnalyses: number;
}

export interface ModelMetricsSummary {
  avgAccuracy: number;
  totalSamples: number;
  confidenceScore: number;
  adaptabilityScore: number;
  learningRate: number;
}