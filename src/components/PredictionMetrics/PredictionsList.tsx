import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, ChartBar } from 'lucide-react';

interface PredictionsListProps {
  predictions: Array<{
    numbers: number[];
    estimatedAccuracy: number;
    targetMatches: number;
    matchesWithSelected: number;
  }>;
  selectedNumbers: number[];
}

const PredictionsList: React.FC<PredictionsListProps> = ({
  predictions,
  selectedNumbers
}) => {
  return (
    <div className="space-y-4">
      {predictions.map((pred, idx) => (
        <Card key={idx} className="p-4 bg-card">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">
                  Jogo {idx + 1} (Objetivo: {pred.targetMatches} acertos)
                </span>
              </div>
              <ChartBar className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {pred.numbers.map((num, numIdx) => (
                <span 
                  key={numIdx} 
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    selectedNumbers.includes(num) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {num.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Estimativa de Acertos</span>
                <span>{pred.estimatedAccuracy.toFixed(1)}%</span>
              </div>
              <Progress value={pred.estimatedAccuracy} className="h-2" />
              
              {selectedNumbers.length === 15 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Acertos com sua seleção
                    </span>
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">
                      {pred.matchesWithSelected} / 15
                    </span>
                  </div>
                  <Progress 
                    value={(pred.matchesWithSelected / 15) * 100} 
                    className="h-2 mt-1 bg-green-200 dark:bg-green-800"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PredictionsList;