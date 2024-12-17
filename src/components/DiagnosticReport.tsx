import React from 'react';
import { Card } from "@/components/ui/card";
import { performanceServices } from '@/services/performanceServices';

interface DiagnosticReportProps {
  modelMetrics: any;
}

const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ modelMetrics }) => {
  return (
    <Card>
      <h2 className="text-lg font-bold">Diagnostic Report</h2>
      <div>
        <p>Model Accuracy: {modelMetrics.accuracy}</p>
        <p>Total Predictions: {modelMetrics.totalPredictions}</p>
        <p>Random Accuracy: {modelMetrics.randomAccuracy}</p>
      </div>
    </Card>
  );
};

export default DiagnosticReport;
