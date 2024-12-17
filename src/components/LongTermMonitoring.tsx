import React from 'react';
import { Card } from "@/components/ui/card";
import { performanceServices } from '@/services/performanceServices';

const LongTermMonitoring: React.FC = () => {
  const [metrics, setMetrics] = React.useState({
    accuracy: 0,
    loss: 0,
    predictions: 0,
    successRate: 0
  });

  React.useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceServices.getModelMetrics();
      setMetrics(currentMetrics);
    };

    const intervalId = setInterval(updateMetrics, 5000);
    updateMetrics();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Monitoramento de Longo Prazo</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Precisão Média</p>
          <p className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Taxa de Perda</p>
          <p className="text-2xl font-bold">{metrics.loss.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total de Predições</p>
          <p className="text-2xl font-bold">{metrics.predictions}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
          <p className="text-2xl font-bold">{(metrics.successRate * 100).toFixed(2)}%</p>
        </div>
      </div>
    </Card>
  );
};

export default LongTermMonitoring;