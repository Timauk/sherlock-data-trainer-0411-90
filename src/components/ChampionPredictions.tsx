import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import { decisionTreeSystem } from '../../src/utils/learning/decisionTree.js';

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
  const [predictions, setPredictions] = useState<Array<{ numbers: number[], estimatedAccuracy: number, targetMatches: number, matchesWithSelected: number, isGoodDecision: boolean }>>([]);
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
      
      // Fatores do campeão que influenciam as previsões
      const championFactors = {
        experience: champion.generation / 1000, // Experiência baseada na geração
        performance: champion.score / 1000, // Performance histórica
        consistency: champion.fitness / 15, // Consistência nos acertos
        adaptability: champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length // Média dos pesos
      };
      
      for (const target of targets) {
        for (let i = 0; i < target.count; i++) {
          // Input enriquecido com informações do campeão
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
          
          // Pesos ajustados com base no conhecimento do campeão
          const weightedNumbers = Array.from({ length: 25 }, (_, idx) => ({
            number: idx + 1,
            weight: predictionArray[idx % predictionArray.length] * 
                   (champion.weights[idx % champion.weights.length] / 1000) *
                   (target.matches / 15) *
                   (1 + championFactors.consistency) * // Bônus de consistência
                   (1 + championFactors.experience * 0.2) // Bônus de experiência
          }));
          
          const selectedNumbers = weightedNumbers
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 15)
            .map(n => n.number)
            .sort((a, b) => a - b);
          
          const estimatedAccuracy = (target.matches / 15) * 100 * 
                                  (1 + championFactors.performance * 0.1); // Ajuste baseado na performance
          
          // Adiciona validação da árvore de decisão
          const lunarPhase = 'Crescente'; // Exemplo de fase lunar, pode ser alterado conforme necessário
          const isGoodDecision = decisionTreeSystem.predict(selectedNumbers, lunarPhase);
          
          if (!isGoodDecision) {
            // Ajusta os pesos se a árvore de decisão indicar que não é uma boa escolha
            selectedNumbers = weightedNumbers
              .slice(15, 30) // Pega os próximos 15 números mais prováveis
              .map(item => item.number)
              .sort((a, b) => a - b);
          }

          newPredictions.push({
            numbers: selectedNumbers,
            estimatedAccuracy: estimatedAccuracy * (isGoodDecision ? 1.2 : 0.8), // Ajusta a confiança
            targetMatches: target.matches,
            matchesWithSelected: 0,
            isGoodDecision
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
            <div className="space-y-4">
              {predictions.map((pred, idx) => (
                <div key={idx} className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                  <div className="font-semibold mb-2">
                    Jogo {idx + 1} (Objetivo: {pred.targetMatches} acertos) - Decisão Boa: {pred.isGoodDecision ? 'Sim' : 'Não'}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pred.numbers.map((num, numIdx) => (
                      <span 
                        key={numIdx} 
                        className={`px-3 py-1 rounded-full ${
                          selectedNumbers.includes(num) 
                            ? 'bg-green-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Estimativa de Acertos: {pred.estimatedAccuracy.toFixed(2)}%</div>
                    {selectedNumbers.length === 15 && (
                      <div className="mt-1 font-semibold text-green-600 dark:text-green-400">
                        Acertos com sua seleção: {pred.matchesWithSelected}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
