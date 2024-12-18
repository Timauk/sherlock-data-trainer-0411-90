import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { DataServices } from '@/services/dataServices';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import TrainingProgress from '@/components/training/TrainingProgress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TrainingPage: React.FC = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleTrainModel = async () => {
    setIsTraining(true);
    setProgress(0);
    
    try {
      systemLogger.log('training', 'Iniciando treinamento do modelo', {
        dataSize: trainingData.length,
        timestamp: new Date().toISOString()
      });

      const model = await DataServices.createSharedModel();
      
      setProgress(30);
      
      const trainedModel = await DataServices.trainModel(model, trainingData, (currentProgress) => {
        setProgress(30 + (currentProgress * 0.7)); // 30% to 100%
      });

      systemLogger.log('training', 'Modelo treinado com sucesso', {
        modelInfo: {
          layers: trainedModel.layers.length,
          totalParams: trainedModel.countParams()
        }
      });

      toast({
        title: "Modelo Treinado",
        description: "O modelo foi treinado com sucesso!",
      });

      setProgress(100);
    } catch (error) {
      systemLogger.error('training', 'Erro ao treinar modelo', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

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
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Treinamento de Modelo</h1>
      
      {trainingData.length === 0 ? (
        <Alert className="mb-4">
          <AlertDescription>
            Carregue os dados de treinamento antes de iniciar o processo.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Dados carregados: {trainingData.length} registros
          </p>
        </div>
      )}

      <Button 
        onClick={handleTrainModel} 
        disabled={isTraining || trainingData.length === 0}
        className="w-full mb-4"
      >
        {isTraining ? "Treinando..." : "Treinar Modelo"}
      </Button>

      {isTraining && <TrainingProgress trainingProgress={progress} />}
    </Card>
  );
};

export default TrainingPage;