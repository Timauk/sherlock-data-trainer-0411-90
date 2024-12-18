import { useState, useEffect } from 'react';
import { TimeSeriesAnalysis } from '../utils/analysis';
import { useToast } from "@/hooks/use-toast";

export const useTimeSeriesAnalysis = (historicalData: number[][]) => {
  const [predictions, setPredictions] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (historicalData.length > 0) {
      try {
        setIsAnalyzing(true);
        const analyzer = new TimeSeriesAnalysis(historicalData);
        const newPredictions = analyzer.analyzeNumbers();
        setPredictions(newPredictions);
        
        toast({
          title: "Análise ARIMA Concluída",
          description: `Previsão baseada em ${historicalData.length} jogos anteriores`
        });
      } catch (error) {
        console.error('Erro na análise temporal:', error);
        toast({
          title: "Erro na Análise",
          description: "Não foi possível completar a análise temporal",
          variant: "destructive"
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [historicalData]);

  return {
    predictions,
    isAnalyzing
  };
};
