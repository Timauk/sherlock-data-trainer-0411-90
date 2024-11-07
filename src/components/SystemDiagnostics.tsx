import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import { performanceMonitor } from "@/utils/performance/performanceMonitor";
import { modelMonitoring } from "@/utils/monitoring/modelMonitoring";
import { feedbackSystem } from "@/utils/prediction/feedbackSystem";
import DiagnosticResults from './DiagnosticResults';
import ConnectionStatus from './SystemDiagnostics/ConnectionStatus';
import { SystemStatus, SpecializedModelsStatus, DataQualityMetrics, AnalysisStatus } from '@/types/monitoring';

export interface DiagnosticResult {
  phase: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const SystemDiagnostics = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  usePerformanceAlerts();

  const getUIComponentCount = () => {
    return document.querySelectorAll('[data-testid], [role]').length;
  };

  const getPerformanceMetrics = () => {
    const metrics = performanceMonitor.getAverageMetrics();
    return {
      avgLatency: metrics.avgLatency || 0,
      avgMemory: metrics.avgMemory || 0,
      avgCPU: metrics.avgCPU || 0
    };
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Fase 1: Gestão de Dados e IA
      const metrics = modelMonitoring.getMetricsSummary();
      const accuracyPercentage = metrics.avgAccuracy * 100;
      diagnosticResults.push({
        phase: "Fase 1: Gestão de Dados e IA",
        status: accuracyPercentage > 50 ? 'success' : 'warning',
        message: `Precisão média: ${accuracyPercentage.toFixed(2)}%`,
        details: `Modelo treinado com ${metrics.totalSamples} amostras`
      });
      setProgress(25);

      // Fase 2: Otimização de Performance
      const perfMetrics = getPerformanceMetrics();
      const memoryMB = (perfMetrics.avgMemory / 1024 / 1024).toFixed(1);
      diagnosticResults.push({
        phase: "Fase 2: Otimização de Performance",
        status: perfMetrics.avgLatency < 1000 ? 'success' : 'warning',
        message: `Latência média: ${perfMetrics.avgLatency.toFixed(2)}ms`,
        details: `CPU: ${perfMetrics.avgCPU?.toFixed(1) || 0}%, Memória: ${memoryMB}MB`
      });
      setProgress(50);

      // Fase 3: Modelos Especializados
      const specializedModels = modelMonitoring.getSpecializedModelsStatus();
      const modelsRatio = specializedModels.activeCount / specializedModels.totalCount;
      diagnosticResults.push({
        phase: "Fase 3: Modelos Especializados",
        status: modelsRatio >= 0.75 ? 'success' : 'warning',
        message: "Status dos Modelos Especializados",
        details: `Ativos: ${specializedModels.activeCount}, Total: ${specializedModels.totalCount}`
      });
      setProgress(75);

      // Fase 4: Validação e Qualidade
      const confidenceCorrelation = feedbackSystem.getConfidenceCorrelation();
      const accuracyTrend = feedbackSystem.getAccuracyTrend();
      const lastAccuracy = accuracyTrend[accuracyTrend.length - 1] || 0;
      diagnosticResults.push({
        phase: "Fase 4: Validação e Qualidade",
        status: confidenceCorrelation > 0.5 ? 'success' : 'warning',
        message: `Correlação de confiança: ${confidenceCorrelation.toFixed(2)}`,
        details: `Tendência de precisão: ${(lastAccuracy * 100).toFixed(1)}%`
      });
      setProgress(85);

      // Fase 5: Análise Avançada
      const analysisStatus = modelMonitoring.getAnalysisStatus();
      diagnosticResults.push({
        phase: "Fase 5: Análise Avançada",
        status: analysisStatus.activeAnalyses >= 6 ? 'success' : 'warning',
        message: "Status das Análises Avançadas",
        details: `Análises ativas: ${analysisStatus.activeAnalyses}`
      });
      setProgress(100);

      setResults(diagnosticResults);
    } catch (error) {
      console.error('Erro durante diagnóstico:', error);
      toast({
        title: "Erro no Diagnóstico",
        description: "Ocorreu um erro durante a execução do diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Diagnóstico do Sistema
          <button 
            onClick={runDiagnostics}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={isRunning}
          >
            {isRunning ? 'Atualizando...' : 'Atualizar'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ConnectionStatus />
        
        {isRunning && (
          <div className="mb-4">
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Executando diagnóstico... {progress.toFixed(0)}%
            </p>
          </div>
        )}
        <DiagnosticResults results={results} />
      </CardContent>
    </Card>
  );
};

export default SystemDiagnostics;