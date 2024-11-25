import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { generatePredictions } from '../utils/prediction/predictionGenerator';
import { systemLogger } from '../utils/logging/systemLogger';

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
  const [isGenerating, setIsGenerating] = useState(false);
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

  const generatePredictionsHandler = async () => {
    if (!champion || !trainedModel || !lastConcursoNumbers.length) {
      toast({
        title: "Erro",
        description: "Não há campeão ou modelo treinado disponível.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const newPredictions = await generatePredictions(
        champion,
        trainedModel,
        lastConcursoNumbers,
        selectedNumbers
      );

      setPredictions(newPredictions.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => selectedNumbers.includes(n)).length
      })));

      systemLogger.log('prediction', `8 jogos gerados com sucesso pelo campeão #${champion.id}`);
      
      toast({
        title: "Previsões Geradas",
        description: `8 jogos foram gerados considerando experiência e performance do campeão! ${
          isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'
        }`
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar previsões: " + (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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
            <Button 
              onClick={generatePredictionsHandler} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isGenerating}
            >
              {isGenerating ? 'Gerando...' : 'Gerar 8 Jogos'}
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