import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { generatePredictions } from '../utils/prediction/predictionGenerator';
import { systemLogger } from '../utils/logging/systemLogger';
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [systemReady, setSystemReady] = useState(false);
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

  useEffect(() => {
    const allDataLoaded = champion && trainedModel && lastConcursoNumbers;
    console.log('Estado dos dados:', {
      hasChampion: !!champion,
      hasModel: !!trainedModel,
      hasNumbers: !!lastConcursoNumbers,
      allDataLoaded
    });
    
    setSystemReady(!!allDataLoaded);
    
    if (allDataLoaded) {
      toast({
        title: "Sistema Pronto",
        description: "Todos os dados foram carregados com sucesso. Pronto para gerar jogos!",
      });
      systemLogger.log('system', 'Sistema pronto para gerar previsões');
    }
  }, [champion, trainedModel, lastConcursoNumbers, toast]);

  const getSystemStatus = () => {
    if (!systemReady) {
      const missingItems = [];
      if (!champion) missingItems.push('campeão');
      if (!trainedModel) missingItems.push('modelo');
      if (!lastConcursoNumbers) missingItems.push('números do último concurso');
      
      console.log('Status do sistema:', {
        systemReady,
        missingItems
      });
      
      return {
        color: 'bg-yellow-500',
        text: `Aguardando: ${missingItems.join(', ')}`,
        icon: <AlertCircle className="h-4 w-4" />,
        ready: false
      };
    }
    return {
      color: 'bg-green-500',
      text: 'Sistema Pronto para Gerar!',
      icon: <CheckCircle2 className="h-4 w-4" />,
      ready: true
    };
  };

  const validateRequirements = () => {
    if (!systemReady) {
      const missingItems = [];
      if (!champion) missingItems.push('campeão');
      if (!trainedModel) missingItems.push('modelo');
      if (!lastConcursoNumbers) missingItems.push('números do último concurso');
      
      console.log('Validação de requisitos:', {
        systemReady,
        missingItems,
        champion: !!champion,
        trainedModel: !!trainedModel,
        lastConcursoNumbers: !!lastConcursoNumbers
      });
      
      toast({
        title: "Sistema em Preparação",
        description: `Aguardando: ${missingItems.join(', ')}`,
        variant: "default"
      });
      return false;
    }
    return true;
  };

  const generatePredictionsHandler = async () => {
    if (!validateRequirements()) return;

    setIsGenerating(true);
    try {
      console.log('Iniciando geração de previsões:', {
        championId: champion?.id,
        hasModel: !!trainedModel,
        numbersLength: lastConcursoNumbers?.length
      });

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

      console.log('Previsões geradas com sucesso:', {
        count: newPredictions.length,
        firstPrediction: newPredictions[0]
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

  const status = getSystemStatus();

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
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white ${status.color}`}>
                {status.icon}
                <span>{status.text}</span>
              </div>
              <Button 
                onClick={generatePredictionsHandler} 
                className={`${status.color} hover:opacity-90 transition-all duration-200`}
                disabled={isGenerating || !status.ready}
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
            </div>
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
              ) : systemReady ? (
                "Clique em 'Gerar 8 Jogos' para ver as previsões"
              ) : (
                "Aguardando carregamento dos dados necessários..."
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;