import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import * as tf from '@tensorflow/tfjs';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import NumberSelector from './NumberSelector';
import PredictionsList from './PredictionsList';
import { systemLogger } from '../utils/logging/systemLogger';
import { PredictionsHeader } from './predictions/PredictionsHeader';
import { PredictionResult } from './predictions/types';
import { SystemStatus } from './predictions/SystemStatus';
import { PredictionGenerator } from './predictions/PredictionGenerator';

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
    if (items.length > 0) {
      systemLogger.log('system', 'Status dos componentes', {
        champion: { exists: !!champion, type: typeof champion, hasId: champion?.id !== undefined },
        model: { loaded: !!trainedModel, type: typeof trainedModel },
        lastNumbers: { exists: !!lastConcursoNumbers, length: lastConcursoNumbers?.length },
      });
    }
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

  const handlePredictionsGenerated = useCallback((newPredictions: PredictionResult[]) => {
    setPredictions(newPredictions);
  }, []);

  useEffect(() => {
    const allDataLoaded = Boolean(champion && trainedModel && lastConcursoNumbers?.length > 0);
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
            onGenerate={() => {
              if (champion && trainedModel) {
                setIsGenerating(true);
                const generator = (
                  <PredictionGenerator
                    champion={champion}
                    trainedModel={trainedModel}
                    lastConcursoNumbers={lastConcursoNumbers}
                    selectedNumbers={selectedNumbers}
                    onPredictionsGenerated={(newPreds) => {
                      handlePredictionsGenerated(newPreds);
                      setIsGenerating(false);
                    }}
                  />
                );
                return generator;
              }
            }}
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