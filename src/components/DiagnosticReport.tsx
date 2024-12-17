import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { systemLogger } from '@/utils/logging/systemLogger';
import { performanceMonitor } from '@/utils/performance'; // Updated import
import { modelMonitoring } from '@/utils/monitoring/modelMonitoring';

interface DiagnosticReport {
  timestamp: string;
  performance: {
    memory: number;
    cpu: number | null;
    latency: number;
  };
  model: {
    accuracy: number;
    activeModels: number;
    totalPredictions: number;
  };
  system: {
    uptime: number;
    alerts: number;
    status: string;
  };
}

const DiagnosticReport = () => {
  const [reports, setReports] = React.useState<DiagnosticReport[]>([]);

  React.useEffect(() => {
    const generateReport = () => {
      const metrics = performanceMonitor.getAverageMetrics();
      const modelStatus = modelMonitoring.getMetricsSummary();
      
      const newReport: DiagnosticReport = {
        timestamp: new Date().toLocaleString(),
        performance: {
          memory: metrics.avgMemory,
          cpu: metrics.avgCPU,
          latency: metrics.avgLatency
        },
        model: {
          accuracy: modelStatus.avgAccuracy,
          activeModels: modelMonitoring.getSpecializedModelsStatus().activeCount,
          totalPredictions: systemLogger.getLogsByType('prediction').length
        },
        system: {
          uptime: performance.now() / 1000 / 60, // minutes
          alerts: systemLogger.getLogsByType('system').filter(log => 
            log.message.toLowerCase().includes('error') || 
            log.message.toLowerCase().includes('warning')
          ).length,
          status: metrics.avgMemory < 0.8 && metrics.avgLatency < 1000 ? 'Healthy' : 'Warning'
        }
      };

      setReports(prev => [...prev.slice(-30), newReport]); // Keep last 30 reports
    };

    generateReport(); // Initial report
    const interval = setInterval(generateReport, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, []);

  const downloadReport = () => {
    const reportText = reports.map(report => `
Diagnostic Report - ${report.timestamp}
----------------------------------------
Performance:
  Memory Usage: ${(report.performance.memory * 100).toFixed(1)}%
  CPU Usage: ${report.performance.cpu ? `${(report.performance.cpu * 100).toFixed(1)}%` : 'N/A'}
  Average Latency: ${report.performance.latency.toFixed(1)}ms

Model Status:
  Accuracy: ${(report.model.accuracy * 100).toFixed(1)}%
  Active Models: ${report.model.activeModels}
  Total Predictions: ${report.model.totalPredictions}

System Status:
  Uptime: ${Math.floor(report.system.uptime)} minutes
  Active Alerts: ${report.system.alerts}
  Overall Status: ${report.system.status}
----------------------------------------
`).join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-report-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Diagnostic Reports
          <Button onClick={downloadReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Reports
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {reports.map((report, index) => (
            <div key={index} className="mb-4 p-3 border rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{report.timestamp}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  report.system.status === 'Healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.system.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Performance</p>
                  <p>Memory: {(report.performance.memory * 100).toFixed(1)}%</p>
                  <p>CPU: {report.performance.cpu ? `${(report.performance.cpu * 100).toFixed(1)}%` : 'N/A'}</p>
                  <p>Latency: {report.performance.latency.toFixed(1)}ms</p>
                </div>
                <div>
                  <p className="font-medium">Model</p>
                  <p>Accuracy: {(report.model.accuracy * 100).toFixed(1)}%</p>
                  <p>Active Models: {report.model.activeModels}</p>
                  <p>Predictions: {report.model.totalPredictions}</p>
                </div>
                <div>
                  <p className="font-medium">System</p>
                  <p>Uptime: {Math.floor(report.system.uptime)}min</p>
                  <p>Alerts: {report.system.alerts}</p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DiagnosticReport;
