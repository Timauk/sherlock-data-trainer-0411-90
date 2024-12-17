import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { systemLogger } from '../utils/logging/systemLogger';
import { PredictionsHeader } from './predictions/PredictionsHeader';
import { PredictionResult } from './predictions/types';
import { SystemStatus } from './predictions/SystemStatus';
import { PredictionGenerator } from './predictions/PredictionGenerator';
import { generatePredictions } from '../utils/prediction';  // Updated import

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
      systemLogger.log('prediction', 'Iniciando geração de previsões', {
        championId: champion.id,
        hasModel: !!trainedModel,
        lastNumbersLength: lastConcursoNumbers.length
      });

      const newPredictions = await generatePredictions(
        champion,
        trainedModel,
        lastConcursoNumbers,
        selectedNumbers
      );

      if (!newPredictions?.length) {
        throw new Error("Nenhuma previsão foi gerada");
      }

      setPredictions(newPredictions);
      
      toast({
        title: "Previsões Geradas",
        description: `${newPredictions.length} jogos foram gerados com sucesso!`,
      });

      systemLogger.log('prediction', 'Previsões geradas com sucesso', {
        count: newPredictions.length,
        championId: champion.id,
        timestamp: new Date().toISOString()
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

  useEffect(() => {
    const allDataLoaded = Boolean(champion && trainedModel?.optimizer && lastConcursoNumbers?.length > 0);
    setSystemReady(allDataLoaded);

    if (allDataLoaded) {
      toast({
        title: "Sistema Pronto",
        description: "Todos os dados foram carregados com sucesso.",
      });
      systemLogger.log('system', 'Sistema pronto para gerar previsões');
    }
  }, [champion, trainedModel, lastConcursoNumbers, toast]);

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
              text: systemReady ? 'Sistema Pronto para Gerar!' : `Aguardando: ${getMissingItems().join(', ')}`,
              icon: systemReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />,
              ready: systemReady
            }}
            isGenerating={isGenerating}
            onGenerate={handlePredictionsGenerated}
            isServerProcessing={isServerProcessing}
          />
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;
