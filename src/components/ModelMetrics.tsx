import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';

interface ModelMetricsProps {
  accuracy: number;
  randomAccuracy: number;
  totalPredictions: number;
  perGameAccuracy?: number;
  perGameRandomAccuracy?: number;
}

const ModelMetrics: React.FC<ModelMetricsProps> = ({ 
  accuracy, 
  randomAccuracy, 
  totalPredictions,
  perGameAccuracy = 0,
  perGameRandomAccuracy = 0
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Métricas do Modelo
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Precisão total: média de todos os jogos</p>
                <p>Precisão por partida: média da partida atual</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">Precisão Total do Modelo</p>
            <p className="text-2xl font-bold">{(accuracy * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Precisão do Modelo por Partida</p>
            <p className="text-2xl font-bold">{(perGameAccuracy * 100).toFixed(2)}%</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">Precisão Aleatória Total</p>
            <p className="text-2xl font-bold">{(randomAccuracy * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm font-medium">Precisão Aleatória por Partida</p>
            <p className="text-2xl font-bold">{(perGameRandomAccuracy * 100).toFixed(2)}%</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Total de Previsões</p>
          <p className="text-2xl font-bold">{totalPredictions}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelMetrics;