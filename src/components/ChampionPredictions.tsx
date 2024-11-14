import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import { Target, Star } from 'lucide-react';
import { predictionMetrics } from '@/utils/prediction/metricsSystem';
import MetricsDisplay from './PredictionMetrics/MetricsDisplay';
import PredictionsList from './PredictionMetrics/PredictionsList';

interface ChampionPredictionsProps {
  champion: Player | undefined;
  trainedModel: tf.LayersModel | null;
  lastConcursoNumbers: number[];
  isServerProcessing?: boolean;
}

const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers,
  isServerProcessing = false
}) => {
  const [predictions, setPredictions] = useState<Array<{
    numbers: number[];
    estimatedAccuracy: number;
    targetMatches: number;
    matchesWithSelected: number;
  }>>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { toast } = useToast();

  const handleNumbersSelected = (numbers: number[]) => {
    setSelectedNumbers(numbers);
    if (predictions.length > 0) {
      setPredictions(predictions.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => numbers.includes(n)).length
      })));
    }
  };

  const generatePredictions = async () => {
    if (!champion || !trainedModel || !lastConcursoNumbers.length) {
      toast({
        title: "Erro",
        description: "Não há campeão ou modelo treinado disponível.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPredictions = [];
      const targets = [
        { matches: 11, count: 2 },
        { matches: 12, count: 2 },
        { matches: 13, count: 2 },
        { matches: 14, count: 1 },
        { matches: 15, count: 1 }
      ];
      
      for (const target of targets) {
        for (let i = 0; i < target.count; i++) {
          const variationFactor = 0.05 + ((15 - target.matches) * 0.02);
          
          const normalizedInput = [
            ...lastConcursoNumbers.slice(0, 15).map(n => {
              const variation = (Math.random() - 0.5) * variationFactor;
              return (n / 25) * (1 + variation);
            }),
            (champion.generation + i) / 1000,
            (Date.now() + i * 1000) / (1000 * 60 * 60 * 24 * 365)
          ];
          
          const inputTensor = tf.tensor2d([normalizedInput]);
          const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
          const predictionArray = Array.from(await prediction.data());
          
          const weightAdjustment = target.matches / 15;
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: predictionArray[idx % predictionArray.length] * 
                   (champion.weights[idx % champion.weights.length] / 1000) *
                   weightAdjustment *
                   (1 + (Math.random() - 0.5) * 0.2)
          }));
          
          const selectedNumbers = weightedNumbers
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 20)
            .sort(() => Math.random() - 0.5)
            .slice(0, 15)
            .map(n => n.number)
            .sort((a, b) => a - b);
          
          const estimatedAccuracy = (target.matches / 15) * 100;
          
          newPredictions.push({
            numbers: selectedNumbers,
            estimatedAccuracy,
            targetMatches: target.matches,
            matchesWithSelected: 0
          });

          // Record metrics
          predictionMetrics.recordPrediction(
            selectedNumbers,
            lastConcursoNumbers,
            estimatedAccuracy / 100
          );

          prediction.dispose();
          inputTensor.dispose();
        }
      }

      const predictionsWithMatches = newPredictions.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => selectedNumbers.includes(n)).length
      }));

      setPredictions(predictionsWithMatches);
      
      toast({
        title: "Previsões Geradas",
        description: `8 jogos foram gerados com diferentes objetivos de acertos! ${
          isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'
        }`
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar previsões: " + 
          (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive"
      });
    }
  };

  const metrics = predictionMetrics.getMetricsSummary();
  const recentMatches = metrics.recentMetrics.map(m => m.matches);

  return (
    <div className="space-y-4">
      <MetricsDisplay 
        averageAccuracy={metrics.averageAccuracy}
        successRate={metrics.successRate}
        totalPredictions={metrics.totalPredictions}
        recentMatches={recentMatches}
      />

      <NumberSelector 
        onNumbersSelected={handleNumbersSelected} 
        predictions={predictions}
      />
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Previsões do Campeão {isServerProcessing ? '(Servidor)' : '(Local)'}</span>
            </div>
            <Button onClick={generatePredictions} className="bg-green-600 hover:bg-green-700">
              <Target className="mr-2 h-4 w-4" />
              Gerar 8 Jogos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PredictionsList 
            predictions={predictions}
            selectedNumbers={selectedNumbers}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;