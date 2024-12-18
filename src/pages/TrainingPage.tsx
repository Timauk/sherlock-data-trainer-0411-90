import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { DataServices } from '@/services/dataServices';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import TrainingProgress from '@/components/training/TrainingProgress';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingChart from '@/components/TrainingChart';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload } from 'lucide-react';

const TrainingPage: React.FC = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchSize, setBatchSize] = useState('32');
  const [epochs, setEpochs] = useState(50);
  const [trainingLogs, setTrainingLogs] = useState<{ epoch: number; loss: number; val_loss: number; }[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = DataServices.processCSV(text);
          setTrainingData(data);
          toast({
            title: "Dados Carregados",
            description: `${data.length} registros carregados com sucesso.`,
          });
        } catch (error) {
          toast({
            title: "Erro ao Carregar Arquivo",
            description: error instanceof Error ? error.message : "Erro desconhecido",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    setProgress(0);
    setTrainingLogs([]);
    
    try {
      systemLogger.log('training', 'Iniciando treinamento do modelo', {
        dataSize: trainingData.length,
        batchSize,
        epochs,
        timestamp: new Date().toISOString()
      });

      const model = await DataServices.createSharedModel();
      
      setProgress(30);
      
      // Training with logs callback
      await DataServices.trainModel(model, trainingData, (currentProgress) => {
        setProgress(30 + (currentProgress * 0.7));
      }, {
        batchSize: parseInt(batchSize),
        epochs,
        onEpochEnd: (epoch, logs) => {
          setTrainingLogs(prev => [...prev, {
            epoch,
            loss: logs?.loss || 0,
            val_loss: logs?.val_loss || 0
          }]);
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
    <Card className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Treinamento de Modelo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Configuração do Treinamento</h2>
            <TrainingControls
              batchSize={batchSize}
              setBatchSize={setBatchSize}
              epochs={epochs}
              setEpochs={setEpochs}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados de Treinamento</h2>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csvUpload"
              />
              <label
                htmlFor="csvUpload"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar CSV
              </label>
              {trainingData.length > 0 && (
                <span className="text-sm text-gray-600">
                  {trainingData.length} registros carregados
                </span>
              )}
            </div>
          </div>

          <Button 
            onClick={handleTrainModel} 
            disabled={isTraining || trainingData.length === 0}
            className="w-full"
          >
            {isTraining ? "Treinando..." : "Iniciar Treinamento"}
          </Button>

          {isTraining && <TrainingProgress trainingProgress={progress} />}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Progresso do Treinamento</h2>
          {trainingLogs.length > 0 ? (
            <TrainingChart logs={trainingLogs} />
          ) : (
            <Alert>
              <AlertDescription>
                O gráfico de treinamento será exibido quando o treinamento começar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TrainingPage;