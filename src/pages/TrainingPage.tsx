import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { dataServices } from '@/services/dataServices';
import { useToast } from "@/hooks/use-toast";

const TrainingPage: React.FC = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const { toast } = useToast();

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const model = await dataServices.GameLogicService.createSharedModel();
      const trainedModel = await dataServices.GameLogicService.trainModel(model, trainingData);
      toast({
        title: "Modelo Treinado",
        description: "O modelo foi treinado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro ao Treinar Modelo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Card>
      <h1>Treinamento de Modelo</h1>
      <button onClick={handleTrainModel} disabled={isTraining}>
        {isTraining ? "Treinando..." : "Treinar Modelo"}
      </button>
    </Card>
  );
};

export default TrainingPage;
