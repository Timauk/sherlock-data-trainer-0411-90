import React, { useState, useEffect, useCallback } from 'react';
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

  const getMissingItems = useCallback(() => {
    const items = [];
    
    console.log('Verificando champion:', {
      champion,
      championId: champion?.id,
      championScore: champion?.score,
      championFitness: champion?.fitness,
      isUndefined: champion === undefined,
      isNull: champion === null
    });

    if (!champion) {
      items.push('campeão');
      console.log('Champion não detectado:', { 
        champion, 
        type: typeof champion,
        hasId: champion?.id !== undefined
      });
    }

    if (!trainedModel) {
      items.push('modelo');
      console.log('Model status:', { 
        modelLoaded: !!trainedModel,
        modelType: typeof trainedModel 
      });
    }

    if (!lastConcursoNumbers?.length) {
      items.push('números do último concurso');
      console.log('Last numbers status:', { 
        numbers: lastConcursoNumbers,
        length: lastConcursoNumbers?.length,
        type: typeof lastConcursoNumbers
      });
    }

    return items;
  }, [champion, trainedModel, lastConcursoNumbers]);

  const getSystemStatus = useCallback(() => {
    const missingItems = getMissingItems();
    console.log('System status check:', {
      systemReady,
      missingItems,
      championDetails: champion ? {
        id: champion.id,
        score: champion.score,
        fitness: champion.fitness
      } : null
    });

    if (!systemReady || missingItems.length > 0) {
      return {
        color: 'bg-yellow-500',
        text: `Aguardando: ${missingItems.join(', ')}`,
        icon: <AlertCircle className="h-4 w-4" />,
        ready: false,
      };
    }
    return {
      color: 'bg-green-500',
      text: 'Sistema Pronto para Gerar!',
      icon: <CheckCircle2 className="h-4 w-4" />,
      ready: true,
    };
  }, [systemReady, getMissingItems, champion]);

  const handleNumbersSelected = useCallback((numbers: number[]) => {
    setSelectedNumbers(numbers);
    setPredictions(prev => prev.map(pred => ({
      ...pred,
      matchesWithSelected: pred.numbers.filter(n => numbers.includes(n)).length,
    })));
  }, []);

  const generatePredictionsHandler = useCallback(async () => {
    if (!systemReady) {
      const missingItems = getMissingItems();
      console.log('Cannot generate - system not ready:', {
        missingItems,
        champion: !!champion,
        trainedModel: !!trainedModel,
        lastConcursoNumbers: !!lastConcursoNumbers
      });

      toast({
        title: "Sistema em Preparação",
        description: `Aguardando: ${missingItems.join(', ')}`,
        variant: "default",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting prediction generation with:', {
        championId: champion?.id,
        modelLoaded: !!trainedModel,
        lastNumbers: lastConcursoNumbers
      });

      const newPredictions = await generatePredictions(
        champion!,
        trainedModel!,
        lastConcursoNumbers,
        selectedNumbers
      );

      if (!newPredictions?.length) {
        throw new Error("Não foi possível gerar previsões");
      }

      setPredictions(newPredictions);
      systemLogger.log('prediction', `8 jogos gerados com sucesso pelo campeão #${champion!.id}`);
      
      toast({
        title: "Previsões Geradas",
        description: `8 jogos foram gerados com sucesso! ${
          isServerProcessing ? '(Processado no servidor)' : '(Processado no navegador)'
        }`,
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: `Erro ao gerar previsões: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [systemReady, champion, trainedModel, lastConcursoNumbers, selectedNumbers, toast, isServerProcessing, getMissingItems]);

  useEffect(() => {
    const allDataLoaded = Boolean(champion && trainedModel && lastConcursoNumbers?.length > 0);
    
    console.log('Verificação detalhada do sistema:', {
      champion: {
        exists: !!champion,
        id: champion?.id,
        score: champion?.score,
        fitness: champion?.fitness,
        type: typeof champion
      },
      trainedModel: {
        exists: !!trainedModel,
        type: typeof trainedModel,
        isCompiled: trainedModel?.compile !== undefined
      },
      lastConcursoNumbers: {
        exists: !!lastConcursoNumbers,
        length: lastConcursoNumbers?.length,
        values: lastConcursoNumbers,
        type: typeof lastConcursoNumbers
      },
      allDataLoaded,
      systemReady
    });

    setSystemReady(allDataLoaded);

    if (allDataLoaded) {
      toast({
        title: "Sistema Pronto",
        description: "Todos os dados foram carregados com sucesso. Pronto para gerar jogos!",
      });
      systemLogger.log('system', 'Sistema pronto para gerar previsões');
    }
  }, [champion, trainedModel, lastConcursoNumbers, toast]);

  useEffect(() => {
    if (csvProgress >= 100 && systemReady && !isGenerating && !predictions.length) {
      console.log('Auto-generating predictions:', {
        csvProgress,
        systemReady,
        isGenerating,
        predictionsLength: predictions.length
      });
      generatePredictionsHandler();
    }
  }, [csvProgress, systemReady, isGenerating, predictions.length, generatePredictionsHandler]);

  return (
    <div className="space-y-4">
      <NumberSelector 
        onNumbersSelected={handleNumbersSelected} 
        predictions={predictions}
      />
      
      <Card className="mt-4">
        <CardHeader>
          <PredictionsHeader 
            status={getSystemStatus()}
            isGenerating={isGenerating}
            onGenerate={generatePredictionsHandler}
            isServerProcessing={isServerProcessing}
          />
        </CardHeader>
        <CardContent>
          {predictions.length > 0 ? (
            <PredictionsList 
              predictions={predictions} 
              selectedNumbers={selectedNumbers} 
            />
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