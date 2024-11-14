import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, ChartBar } from 'lucide-react';

interface MetricsDisplayProps {
  averageAccuracy: number;
  successRate: number;
  totalPredictions: number;
  recentMatches: number[];
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  averageAccuracy,
  successRate,
  totalPredictions,
  recentMatches
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Métricas de Previsão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Precisão Média</span>
            <span className="text-sm font-medium">
              {(averageAccuracy * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={averageAccuracy * 100} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Taxa de Sucesso (11+ acertos)</span>
            <span className="text-sm font-medium">
              {(successRate * 100).toFixed(1)}%
            </span>
          </div>
          <Progress value={successRate * 100} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Total de Previsões</span>
          </div>
          <span className="text-sm font-medium">{totalPredictions}</span>
        </div>

        {recentMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ChartBar className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Últimos Acertos</span>
            </div>
            <div className="flex gap-2">
              {recentMatches.map((matches, idx) => (
                <div 
                  key={idx}
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    matches >= 11 ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {matches}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricsDisplay;