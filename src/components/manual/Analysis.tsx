import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Analysis = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ferramentas de Análise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <h3 className="text-lg font-semibold">Análises Disponíveis</h3>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Análise de Padrões:</strong> Identificação de sequências recorrentes</li>
            <li><strong>Distribuição:</strong> Análise estatística avançada</li>
            <li><strong>Tendências:</strong> Análise temporal com ARIMA</li>
            <li><strong>Correlações:</strong> Análise de correlações complexas</li>
            <li><strong>Previsões:</strong> Modelos preditivos ensemble</li>
          </ul>
        </section>

        <Separator className="my-4" />

        <section>
          <h3 className="text-lg font-semibold">Visualizações</h3>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Gráficos:</strong> Visualizações interativas em tempo real</li>
            <li><strong>Métricas:</strong> Indicadores de desempenho</li>
            <li><strong>Evolução:</strong> Acompanhamento geracional</li>
            <li><strong>Diagnósticos:</strong> Monitoramento do sistema</li>
            <li><strong>Heatmaps:</strong> Mapas de calor de padrões</li>
          </ul>
        </section>
      </CardContent>
    </Card>
  );
};

export default Analysis;