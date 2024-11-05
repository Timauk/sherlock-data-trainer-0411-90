import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import { Trophy, Target, Star, ChartBar } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

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
  const [predictions, setPredictions] = useState<Array<{ numbers: number[], estimatedAccuracy: number, targetMatches: number, matchesWithSelected: number }>>([]);
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
        description: `8 jogos foram gerados com diferentes objetivos de acertos! ${isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'}`
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar previsões: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
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
          {predictions.length > 0 ? (
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
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Clique no botão para gerar 8 previsões para o próximo concurso</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;