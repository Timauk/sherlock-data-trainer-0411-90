import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import { Target, Star, Trophy } from 'lucide-react';
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

  const calculateVariationFactor = (targetMatches: number, championFitness: number) => {
    // Dynamic variation factor based on champion's fitness and target matches
    const baseFactor = 0.05;
    const matchAdjustment = (15 - targetMatches) * 0.02;
    const fitnessAdjustment = championFitness ? (1 / championFitness) * 0.01 : 0;
    return baseFactor + matchAdjustment + fitnessAdjustment;
  };

  const normalizeInput = (number: number, championWeight: number, targetMatches: number) => {
    const baseNormalization = number / 25;
    const weightInfluence = championWeight / 1000;
    const targetAdjustment = targetMatches / 15;
    return baseNormalization * (1 + weightInfluence * targetAdjustment);
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
          const variationFactor = calculateVariationFactor(target.matches, champion.fitness);
          
          // Using tf.tidy for automatic memory cleanup
          const prediction = await tf.tidy(() => {
            const normalizedInput = tf.tensor2d([
              lastConcursoNumbers.slice(0, 15).map(n => 
                normalizeInput(n, champion.weights[n % champion.weights.length], target.matches)
              ),
              [(champion.generation + i) / 1000],
              [(Date.now() + i * 1000) / (1000 * 60 * 60 * 24 * 365)]
            ]);
            
            return trainedModel.predict(normalizedInput) as tf.Tensor;
          });
          
          const predictionArray = Array.from(await prediction.data());
          
          const weightAdjustment = target.matches / 15;
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: predictionArray[idx % predictionArray.length] * 
                   (champion.weights[idx % champion.weights.length] / 1000) *
                   weightAdjustment
          }));
          
          const selectedNumbers = weightedNumbers
            .sort((a, b) => b.weight - a.weight)
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

          predictionMetrics.recordPrediction(
            selectedNumbers,
            lastConcursoNumbers,
            estimatedAccuracy / 100
          );

          // Ensure proper cleanup
          prediction.dispose();
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