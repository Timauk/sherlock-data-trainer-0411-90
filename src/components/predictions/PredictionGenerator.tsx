import React from 'react';
import { useToast } from "@/hooks/use-toast";
import { generatePredictions } from '@/utils/predictions/predictionCore';
import { systemLogger } from '@/utils/logging/systemLogger';
import { Player } from '@/types/gameTypes';
import { PredictionResult } from './types';
import * as tf from '@tensorflow/tfjs';

interface PredictionGeneratorProps {
  champion: Player;
  trainedModel: tf.LayersModel;
  lastConcursoNumbers: number[];
  selectedNumbers: number[];
  onPredictionsGenerated: (predictions: PredictionResult[]) => void;
}

export const PredictionGenerator: React.FC<PredictionGeneratorProps> = ({
  champion,
  trainedModel,
  lastConcursoNumbers,
  selectedNumbers,
  onPredictionsGenerated,
}) => {
  const { toast } = useToast();

  const generatePredictionsHandler = async () => {
    try {
      const newPredictions = await generatePredictions(
        champion,
        trainedModel,
        lastConcursoNumbers,
        selectedNumbers
      );

      if (!newPredictions?.length) {
        throw new Error("Não foi possível gerar previsões");
      }

      onPredictionsGenerated(newPredictions);
      systemLogger.log('prediction', `8 jogos gerados pelo campeão #${champion.id}`);
      toast({
        title: "Previsões Geradas",
        description: "8 jogos foram gerados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: `Erro ao gerar previsões: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <button onClick={generatePredictionsHandler}>
      Gerar Previsões
    </button>
  );
};
