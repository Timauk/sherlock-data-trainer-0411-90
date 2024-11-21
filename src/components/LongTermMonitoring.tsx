import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { performanceMonitor } from "@/utils/performance/performanceMonitor";
import { modelMonitoring } from "@/utils/monitoring/modelMonitoring";

interface SystemHealth {
  memory: number;
  accuracy: number;
  uptime: number;
  predictions: number;
  errors: number;
}

const LongTermMonitoring = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();
  const FOUR_HOURS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) throw new Error('Falha ao verificar status do sistema');
        
        const data = await response.json();
        const metrics = performanceMonitor.getAverageMetrics(240); // 4 hours
        const modelStatus = modelMonitoring.getSystemStatus();

        setHealth({
          memory: metrics.avgMemory,
          accuracy: metrics.avgAccuracy,
          uptime: data.uptime,
          predictions: data.totalPredictions || 0,
          errors: modelStatus.alerts
        });

        setLastCheck(new Date());

        // Alerta se houver problemas
        if (metrics.avgMemory > 0.9 || metrics.avgAccuracy < 0.5 || modelStatus.alerts > 0) {
          toast({
            title: "Alerta de Saúde do Sistema",
            description: "Detectados possíveis problemas no desempenho do sistema.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Erro ao verificar saúde do sistema:', error);
        toast({
          title: "Erro de Monitoramento",
          description: "Não foi possível verificar o estado do sistema.",
          variant: "destructive"
        });
      }
    };

    // Verifica imediatamente e depois a cada 4 horas
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, FOUR_HOURS);

    return () => clearInterval(interval);
  }, [toast]);

  if (!health || !lastCheck) return null;

  const getHealthStatus = (value: number, type: 'memory' | 'accuracy') => {
    if (type === 'memory') {
      return value > 0.9 ? 'critical' : value > 0.7 ? 'warning' : 'good';
    }
    return value < 0.5 ? 'critical' : value < 0.7 ? 'warning' : 'good';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Monitoramento de Longo Prazo
          <span className="text-sm font-normal">
            Última verificação: {lastCheck.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Uso de Memória</p>
          <Progress 
            value={health.memory * 100} 
            className={`h-2 ${
              getHealthStatus(health.memory, 'memory') === 'critical' 
                ? 'bg-red-200' 
                : getHealthStatus(health.memory, 'memory') === 'warning'
                ? 'bg-yellow-200'
                : 'bg-green-200'
            }`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {(health.memory * 100).toFixed(1)}% em uso
          </p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Precisão do Modelo</p>
          <Progress 
            value={health.accuracy * 100}
            className={`h-2 ${
              getHealthStatus(health.accuracy, 'accuracy') === 'critical'
                ? 'bg-red-200'
                : getHealthStatus(health.accuracy, 'accuracy') === 'warning'
                ? 'bg-yellow-200'
                : 'bg-green-200'
            }`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {(health.accuracy * 100).toFixed(1)}% de precisão
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium">Tempo Online</p>
            <p className="text-2xl font-bold">
              {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Total de Previsões</p>
            <p className="text-2xl font-bold">{health.predictions}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Alertas</p>
            <p className="text-2xl font-bold text-red-500">{health.errors}</p>
          </div>
        </div>

        {health.errors > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              Detectados {health.errors} problemas no sistema que requerem atenção.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LongTermMonitoring;