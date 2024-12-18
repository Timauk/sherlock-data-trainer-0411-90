export interface SystemStatus {
  healthy: boolean;
  health: number;
  alerts: number;
}

export interface SpecializedModelsStatus {
  active: boolean;
  activeCount: number;
  totalCount: number;
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
}