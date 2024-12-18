import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { systemLogger } from '../utils/logging/systemLogger';
import { PredictionsHeader } from './predictions/PredictionsHeader';
import { PredictionResult } from '@/features/predictions/types';
import { SystemStatus } from '@/features/predictions/components/SystemStatus';
import { generatePredictions, generateDirectPredictions } from '@/features/predictions/utils/predictionUtils';

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
    if (!champion) items.push('campeão');
    if (!trainedModel) items.push('modelo');
    if (!lastConcursoNumbers?.length) items.push('números do último concurso');
    return items;
  }, [champion, trainedModel, lastConcursoNumbers]);

  useEffect(() => {
    const items = getMissingItems();
    systemLogger.log('system', 'Estado dos componentes de previsão', {
      champion: { exists: !!champion, type: typeof champion, hasId: champion?.id !== undefined },
      model: { 
        loaded: !!trainedModel, 
        hasOptimizer: trainedModel?.optimizer !== undefined,
        compiled: trainedModel?.optimizer !== undefined 
      },
      lastNumbers: { exists: !!lastConcursoNumbers, length: lastConcursoNumbers?.length },
      missingItems: items,
      timestamp: new Date().toISOString()
    });
  }, [champion, trainedModel, lastConcursoNumbers, getMissingItems]);

  const handleNumbersSelected = useCallback((numbers: number[]) => {
    setSelectedNumbers(numbers);
    setPredictions(prev =>
      prev.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => numbers.includes(n)).length,
      }))
    );
  }, []);

  const handlePredictionsGenerated = useCallback(async () => {
    try {
      if (!champion || !trainedModel || !lastConcursoNumbers) {
        throw new Error("Dados necessários não disponíveis");
      }

      setIsGenerating(true);
      
      const newPredictions = await generatePredictions(
        champion,
        trainedModel,
        lastConcursoNumbers,
        selectedNumbers
      );

      setPredictions(newPredictions);
      
      toast({
        title: "Previsões Geradas",
        description: `${newPredictions.length} jogos foram gerados com sucesso!`,
      });

    } catch (error) {
      systemLogger.error('prediction', 'Erro na geração de previsões', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        championId: champion?.id
      });

      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [champion, trainedModel, lastConcursoNumbers, selectedNumbers, toast]);

  const handleDirectPredictions = async () => {
    try {
      if (!trainedModel || !lastConcursoNumbers) {
        throw new Error("Modelo ou dados não disponíveis");
      }

      setIsGenerating(true);
      
      const directResults = await generateDirectPredictions(trainedModel, lastConcursoNumbers);
      
      const formattedPredictions = directResults.map(numbers => ({
        numbers,
        estimatedAccuracy: 100,
        targetMatches: 15,
        matchesWithSelected: selectedNumbers.filter(n => numbers.includes(n)).length,
        isGoodDecision: true
      }));

      setPredictions(formattedPredictions);
      
      toast({
        title: "Previsões Diretas Geradas",
        description: "10 jogos foram gerados diretamente do modelo!",
      });

    } catch (error) {
      toast({
        title: "Erro na Geração Direta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const allDataLoaded = Boolean(trainedModel?.optimizer && lastConcursoNumbers?.length > 0);
    setSystemReady(allDataLoaded);

    if (allDataLoaded) {
      toast({
        title: "Sistema Pronto",
        description: "Todos os dados foram carregados com sucesso.",
      });
      systemLogger.log('system', 'Sistema pronto para gerar previsões');
    }
  }, [trainedModel, lastConcursoNumbers, toast]);

  return (
    <div className="space-y-4">
      <NumberSelector 
        onNumbersSelected={handleNumbersSelected} 
        predictions={predictions}
      />
      
      <Card className="mt-4">
        <CardHeader>
          <PredictionsHeader 
            status={{
              color: systemReady ? 'bg-green-500' : 'bg-yellow-500',
              text: systemReady ? 'Sistema Pronto para Gerar!' : `Aguardando dados necessários`,
              icon: systemReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />,
              ready: systemReady
            }}
            isGenerating={isGenerating}
            onGenerate={handlePredictionsGenerated}
            isServerProcessing={isServerProcessing}
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando previsões...</p>
              </div>
            ) : predictions.length > 0 ? (
              <PredictionsList 
                predictions={predictions} 
                selectedNumbers={selectedNumbers}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Aguardando entrada de dados ou processamento...
              </div>
            )}
            
            <Button
              onClick={handleDirectPredictions}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={!systemReady || isGenerating}
            >
              <Zap className="mr-2 h-4 w-4" />
              DIRETÃO - Gerar 10 Jogos Direto do Modelo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;

