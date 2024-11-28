import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { generatePredictions } from '../utils/prediction/predictionGenerator';
import { systemLogger } from '../utils/logging/systemLogger';
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { PredictionsHeader } from './predictions/PredictionsHeader';
import { PredictionResult } from './predictions/types';

interface ChampionPredictionsProps {
  champion: Player | undefined;
  trainedModel: tf.LayersModel | null;
  lastConcursoNumbers: number[];
  isServerProcessing?: boolean;
  csvProgress?: number;
}

const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers,
  isServerProcessing = false,
  csvProgress = 0
}) => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
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

  // Nova lógica para auto-gerar quando o CSV terminar
  useEffect(() => {
    if (csvProgress >= 100 && systemReady && !isGenerating && predictions.length === 0) {
      generatePredictionsHandler();
    }
  }, [csvProgress, systemReady, isGenerating, predictions.length]);

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

  const generatePredictionsHandler = async () => {
    if (!systemReady) {
      const missingItems = [];
      if (!champion) missingItems.push('campeão');
      if (!trainedModel) missingItems.push('modelo');
      if (!lastConcursoNumbers) missingItems.push('números do último concurso');
      
      toast({
        title: "Sistema em Preparação",
        description: `Aguardando: ${missingItems.join(', ')}`,
        variant: "default"
      });
      return;
    }

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

  const status = getSystemStatus();

  return (
    <div className="space-y-4">
      <NumberSelector 
        onNumbersSelected={handleNumbersSelected} 
        predictions={predictions}
      />
      
      <Card className="mt-4">
        <CardHeader>
          <PredictionsHeader 
            status={status}
            isGenerating={isGenerating}
            onGenerate={generatePredictionsHandler}
            isServerProcessing={isServerProcessing}
          />
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