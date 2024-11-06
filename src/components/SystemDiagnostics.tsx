import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePerformanceAlerts } from "@/hooks/usePerformanceAlerts";
import DiagnosticResults from './DiagnosticResults';
import ConnectionStatus from './SystemDiagnostics/ConnectionStatus';
import { getAIDiagnostics } from '@/utils/diagnostics/aiDiagnostics';
import { getPerformanceDiagnostics } from '@/utils/diagnostics/performanceDiagnostics';
import { getDataQualityDiagnostics } from '@/utils/diagnostics/dataQualityDiagnostics';

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

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Fase 1: Gestão de Dados e IA
      const aiMetrics = getAIDiagnostics();
      diagnosticResults.push({
        phase: "Fase 1: Gestão de Dados e IA",
        status: aiMetrics.accuracy > 0.5 ? 'success' : 'warning',
        message: `Precisão média: ${(aiMetrics.accuracy * 100).toFixed(2)}%`,
        details: `Modelo treinado com ${aiMetrics.samples} amostras`
      });
      setProgress(20);

      // Fase 2: Performance do Sistema
      const perfMetrics = getPerformanceDiagnostics();
      diagnosticResults.push({
        phase: "Fase 2: Performance do Sistema",
        status: perfMetrics.latency < 1000 ? 'success' : 'warning',
        message: `Latência: ${perfMetrics.latency.toFixed(2)}ms`,
        details: `CPU: ${perfMetrics.cpuUsage?.toFixed(1) || 0}%, Memória: ${(perfMetrics.memoryUsage * 100).toFixed(1)}%`
      });
      setProgress(40);

      // Fase 3: Qualidade dos Dados
      const dataQuality = getDataQualityDiagnostics([]);
      diagnosticResults.push({
        phase: "Fase 3: Qualidade dos Dados",
        status: dataQuality.completeness > 0.8 ? 'success' : 'warning',
        message: `Completude: ${(dataQuality.completeness * 100).toFixed(1)}%`,
        details: `Consistência: ${(dataQuality.consistency * 100).toFixed(1)}%, Unicidade: ${(dataQuality.uniqueness * 100).toFixed(1)}%`
      });
      setProgress(60);

      // Fase 4: Validação e Qualidade
      diagnosticResults.push({
        phase: "Fase 4: Validação e Qualidade",
        status: aiMetrics.confidence > 0.7 ? 'success' : 'warning',
        message: `Correlação de confiança: ${aiMetrics.confidence.toFixed(2)}`,
        details: `Tendência de precisão: ${(aiMetrics.trend * 100).toFixed(1)}%`
      });
      setProgress(80);

      // Fase 5: Estabilidade do Sistema
      diagnosticResults.push({
        phase: "Fase 5: Estabilidade do Sistema",
        status: aiMetrics.stability > 0.8 ? 'success' : 'warning',
        message: `Estabilidade: ${(aiMetrics.stability * 100).toFixed(1)}%`,
        details: `Throughput: ${perfMetrics.throughput.toFixed(1)} ops/s`
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
    const interval = setInterval(runDiagnostics, 60000);
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