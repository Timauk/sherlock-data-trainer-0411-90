import React from 'react';
import { temporalAccuracyTracker } from '@/utils/predictions/predictionCore';

export interface DiagnosticResult {
  phase: string;
  status: 'error' | 'warning' | 'success';
  message: string;
  details?: string;
}

const SystemDiagnostics: React.FC = () => {
  return (
    <div>
      <h2>System Diagnostics</h2>
      <div>
        <h3>Temporal Accuracy</h3>
        <p>Average Accuracy: {temporalAccuracyTracker.getAverageAccuracy().toFixed(2)}%</p>
        <p>Accuracy History: {JSON.stringify(temporalAccuracyTracker.accuracyHistory)}</p>
      </div>
    </div>
  );
};

export default SystemDiagnostics;