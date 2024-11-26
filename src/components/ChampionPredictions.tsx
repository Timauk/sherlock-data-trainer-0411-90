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
import { Loader2 } from "lucide-react";

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

  const validateRequirements = () => {
    if (!champion) {
      toast({
        title: "Erro",
        description: "Não há campeão disponível para gerar previsões. Aguarde o treinamento completar.",
        variant: "destructive"
      });
      return false;
    }

    if (!trainedModel) {
      toast({
        title: "Erro",
        description: "O modelo não está treinado ou disponível. Aguarde o treinamento completar.",
        variant: "destructive"
      });
      return false;
    }

    if (!lastConcursoNumbers || lastConcursoNumbers.length === 0) {
      toast({
        title: "Erro",
        description: "Não há números do último concurso disponíveis. Carregue os dados primeiro.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const generatePredictionsHandler = async () => {
    if (!validateRequirements()) return;

    setIsGenerating(true);
    try {
      const newPredictions = await generatePredictions(
        champion!,
        trainedModel!,
        lastConcursoNumbers,
        selectedNumbers
      );

      if (!newPredictions || newPredictions.length === 0) {
        throw new Error("Não foi possível gerar previsões");
      }

      setPredictions(newPredictions);
      
      systemLogger.log('prediction', `8 jogos gerados com sucesso pelo campeão #${champion!.id}`);
      
      toast({
        title: "Previsões Geradas",
        description: `8 jogos foram gerados com sucesso! ${
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
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar 8 Jogos'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {predictions.length > 0 ? (
            <PredictionsList predictions={predictions} selectedNumbers={selectedNumbers} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Gerando previsões...</p>
                </div>
              ) : (
                "Clique em 'Gerar 8 Jogos' para ver as previsões"
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;