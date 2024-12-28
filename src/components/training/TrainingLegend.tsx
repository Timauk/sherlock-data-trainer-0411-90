import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricExplanation {
  name: string;
  description: string;
  goodValue: string;
  warning: string;
}

const metrics: MetricExplanation[] = [
  {
    name: "Loss",
    description: "Medida de erro do modelo. Quanto menor, melhor.",
    goodValue: "< 0.5",
    warning: "Se > 0.8, considere ajustar a taxa de aprendizado"
  },
  {
    name: "Accuracy",
    description: "Precisão do modelo em prever os números corretos.",
    goodValue: "> 70%",
    warning: "Se < 50%, considere aumentar épocas de treinamento"
  },
  {
    name: "Val_Loss",
    description: "Erro medido em dados não vistos pelo modelo.",
    goodValue: "Próximo ao Loss",
    warning: "Se muito maior que Loss, modelo pode estar overfitting"
  },
  {
    name: "Convergência",
    description: "Velocidade de melhoria do modelo.",
    goodValue: "Redução constante do Loss",
    warning: "Se estável por muitas épocas, considere early stopping"
  }
];

const TrainingLegend = () => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Legenda das Métricas
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Guia para interpretação das métricas de treinamento</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.name} className="p-3 border rounded-lg">
              <h4 className="font-semibold text-lg">{metric.name}</h4>
              <p className="text-sm text-muted-foreground">{metric.description}</p>
              <div className="mt-2">
                <p className="text-sm text-green-600">✓ Bom: {metric.goodValue}</p>
                <p className="text-sm text-yellow-600">⚠️ Atenção: {metric.warning}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingLegend;