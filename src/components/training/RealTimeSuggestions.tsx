import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RealTimeSuggestionsProps {
  loss: number;
  accuracy: number;
  valLoss: number;
  epoch: number;
  convergenceRate: number;
}

const RealTimeSuggestions: React.FC<RealTimeSuggestionsProps> = ({
  loss,
  accuracy,
  valLoss,
  epoch,
  convergenceRate
}) => {
  const getSuggestions = () => {
    const suggestions = [];

    // Análise de Loss
    if (loss > 0.8) {
      suggestions.push({
        type: "warning",
        title: "Loss Alto",
        message: "Considere reduzir a taxa de aprendizado ou aumentar o batch size"
      });
    }

    // Análise de Accuracy
    if (accuracy < 0.5) {
      suggestions.push({
        type: "warning",
        title: "Precisão Baixa",
        message: "Aumente o número de épocas ou ajuste a arquitetura do modelo"
      });
    }

    // Análise de Overfitting
    if (valLoss > loss * 1.2) {
      suggestions.push({
        type: "error",
        title: "Possível Overfitting",
        message: "Considere adicionar dropout ou reduzir a complexidade do modelo"
      });
    }

    // Análise de Convergência
    if (convergenceRate < 0.001 && epoch > 10) {
      suggestions.push({
        type: "warning",
        title: "Convergência Lenta",
        message: "O modelo pode estar estagnado. Considere ajustar a taxa de aprendizado"
      });
    }

    // Bom Progresso
    if (loss < 0.5 && accuracy > 0.7 && valLoss < loss * 1.1) {
      suggestions.push({
        type: "success",
        title: "Bom Progresso",
        message: "O modelo está apresentando bom desempenho e generalização"
      });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div className="space-y-4">
      {suggestions.map((suggestion, index) => (
        <Alert
          key={index}
          variant={suggestion.type === "success" ? "default" : "destructive"}
          className={
            suggestion.type === "success" 
              ? "border-green-500 bg-green-50" 
              : suggestion.type === "warning"
              ? "border-yellow-500 bg-yellow-50"
              : "border-red-500 bg-red-50"
          }
        >
          {suggestion.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : suggestion.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle>{suggestion.title}</AlertTitle>
          <AlertDescription>{suggestion.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default RealTimeSuggestions;