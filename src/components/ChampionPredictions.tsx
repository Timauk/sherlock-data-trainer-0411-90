import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import { decisionTreeSystem } from '../../src/utils/learning/decisionTree.js';
import { tfDecisionTree } from '../utils/learning/tfDecisionTree';
import PredictionsList from './PredictionsList';

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
    isGoodDecision: boolean;
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
      
      // Fatores técnicos do campeão
      const championFactors = {
        experience: champion.generation / 1000,
        performance: champion.score / 1000,
        consistency: champion.fitness / 15,
        adaptability: champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length
      };

      // Análise de frequência dos últimos números
      const frequencyMap = new Map<number, number>();
      for (let i = 1; i <= 25; i++) {
        frequencyMap.set(i, 0);
      }
      lastConcursoNumbers.forEach(num => {
        frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      });
      
      for (const target of targets) {
        for (let i = 0; i < target.count; i++) {
          // Entrada normalizada com fatores técnicos
          const normalizedInput = [
            ...lastConcursoNumbers.slice(0, 15).map(n => n / 25),
            championFactors.experience,
            championFactors.performance,
            championFactors.consistency,
            championFactors.adaptability,
            Date.now() / (1000 * 60 * 60 * 24 * 365)
          ];
          
          const inputTensor = tf.tensor2d([normalizedInput]);
          const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
          const predictionArray = Array.from(await prediction.data());
          
          // Pesos técnicos para cada número
          let weightedNumbers = Array.from({ length: 25 }, (_, idx) => {
            const number = idx + 1;
            const frequency = frequencyMap.get(number) || 0;
            const baseWeight = predictionArray[idx % predictionArray.length];
            const frequencyWeight = frequency / Math.max(...Array.from(frequencyMap.values()));
            const championWeight = champion.weights[idx % champion.weights.length] / 1000;
            
            return {
              number,
              weight: baseWeight * 
                     (1 + frequencyWeight) * 
                     (1 + championWeight) * 
                     (1 + championFactors.consistency) * 
                     (target.matches / 15)
            };
          });
          
          // Ordenação por peso e seleção dos números
          weightedNumbers.sort((a, b) => b.weight - a.weight);
          
          // Garantir que não pegue os mesmos números de outras previsões
          const existingNumbers = new Set(newPredictions.flatMap(p => p.numbers));
          let selectedNumbers = weightedNumbers
            .filter(n => !existingNumbers.has(n.number))
            .slice(0, 15)
            .map(n => n.number)
            .sort((a, b) => a - b);
          
          // Se não tiver números suficientes, pega os próximos disponíveis
          if (selectedNumbers.length < 15) {
            const remaining = weightedNumbers
              .filter(n => !selectedNumbers.includes(n.number))
              .slice(0, 15 - selectedNumbers.length)
              .map(n => n.number);
            selectedNumbers = [...selectedNumbers, ...remaining].sort((a, b) => a - b);
          }
          
          const estimatedAccuracy = (target.matches / 15) * 100 * 
                                  (1 + championFactors.performance * 0.1);
          
          // Usando ambos os sistemas de decisão
          const classicDecision = decisionTreeSystem.predict(selectedNumbers, 'Crescente');
          const tfDecision = await tfDecisionTree.predict(selectedNumbers, 'Crescente');
          const isGoodDecision = classicDecision && tfDecision;

          newPredictions.push({
            numbers: selectedNumbers,
            estimatedAccuracy: estimatedAccuracy * (isGoodDecision ? 1.2 : 0.8),
            targetMatches: target.matches,
            matchesWithSelected: selectedNumbers.filter(n => selectedNumbers.includes(n)).length,
            isGoodDecision
          });

          // Adiciona a decisão ao histórico de treinamento do TF
          tfDecisionTree.addDecision(selectedNumbers, 'Crescente', isGoodDecision);

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
        description: `8 jogos foram gerados considerando experiência (${(championFactors.experience * 100).toFixed(1)}%), performance (${(championFactors.performance * 100).toFixed(1)}%) e consistência (${(championFactors.consistency * 100).toFixed(1)}%) do campeão! ${isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'}`
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
            <span>Previsões do Campeão {isServerProcessing ? '(Servidor)' : '(Local)'}</span>
            <Button onClick={generatePredictions} className="bg-green-600 hover:bg-green-700">
              Gerar 8 Jogos
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length > 0 ? (
            <PredictionsList predictions={predictions} selectedNumbers={selectedNumbers} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              Clique no botão para gerar 8 previsões para o próximo concurso
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;