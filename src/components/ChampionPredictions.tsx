import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { systemLogger } from '../utils/logging/systemLogger';
import { PredictionsHeader } from './predictions/PredictionsHeader';
import { PredictionResult } from '@/features/predictions/types';
import { generatePredictions, generateDirectPredictions } from '@/features/predictions/utils/predictionUtils';
import type { LayersModel } from '@tensorflow/tfjs';

interface ChampionPredictionsProps {
  champion: Player | undefined;
  trainedModel: LayersModel | null;
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
  const { toast } = useToast();

  // Gerar predições automaticamente quando o modelo e campeão estiverem disponíveis
  useEffect(() => {
    if (trainedModel && champion && lastConcursoNumbers.length > 0) {
      handlePredictionsGenerated();
    }
  }, [trainedModel, champion, lastConcursoNumbers]);

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
    if (!trainedModel || !lastConcursoNumbers) {
      toast({
        title: "Erro",
        description: "Modelo ou dados não disponíveis",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const newPredictions = await generatePredictions(
        champion!,
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
      toast({
        title: "Erro na Geração",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      systemLogger.error('prediction', 'Erro ao gerar predições', { error });
    } finally {
      setIsGenerating(false);
    }
  }, [champion, trainedModel, lastConcursoNumbers, selectedNumbers, toast]);

  const handleDirectPredictions = async () => {
    if (!trainedModel || !lastConcursoNumbers) {
      toast({
        title: "Erro",
        description: "Modelo ou dados não disponíveis",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const directResults = await generateDirectPredictions(trainedModel, lastConcursoNumbers);
      
      const formattedPredictions = directResults.map(numbers => ({
        numbers,
        estimatedAccuracy: 0.75,
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
      systemLogger.error('prediction', 'Erro na geração direta', { error });
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
          <PredictionsHeader 
            status={{
              color: trainedModel ? 'bg-green-500' : 'bg-yellow-500',
              text: trainedModel ? 'Sistema Pronto para Gerar!' : 'Aguardando modelo',
              icon: trainedModel ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />,
              ready: !!trainedModel
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
                Clique em "Gerar Previsões" para começar
              </div>
            )}
            
            <Button
              onClick={handleDirectPredictions}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={!trainedModel || isGenerating}
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