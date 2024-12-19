import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import TrainingProgress from '@/components/training/TrainingProgress';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingChart from '@/components/TrainingChart';
import { extractFeatures } from '@/utils/features/featureEngineering';
import { createEnhancedModel } from '@/utils/training/modelArchitecture';
import { performCrossValidation } from '@/utils/training/crossValidation';
import { Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as tf from '@tensorflow/tfjs';

interface TrainingLog {
  epoch: number;
  loss: number;
  val_loss: number;
  accuracy?: number;
  val_accuracy?: number;
}

const TrainingPage: React.FC = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState("32");
  const [validationMetrics, setValidationMetrics] = useState<{accuracy: number, loss: number}[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      systemLogger.log('training', 'Iniciando carregamento do CSV', { fileName: file.name });
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      
      const processedData = lines.map(line => {
        const [concurso, data, ...numeros] = line.split(',');
        return {
          numbers: numeros.slice(0, 15).map(Number),
          date: new Date(data.split('/').reverse().join('-'))
        };
      });

      setTrainingData(processedData.map(d => d.numbers));
      setDates(processedData.map(d => d.date));

      systemLogger.log('training', 'Dados carregados com sucesso', {
        totalSamples: processedData.length,
        firstSample: processedData[0].numbers
      });

      toast({
        title: "Dados Carregados",
        description: `${processedData.length} registros processados.`
      });
    } catch (error) {
      systemLogger.error('training', 'Erro ao carregar arquivo', { error });
      toast({
        title: "Erro ao Carregar Arquivo",
        description: "Formato de arquivo inválido",
        variant: "destructive"
      });
    }
  };

  const saveModel = async () => {
    if (!model) {
      toast({
        title: "Erro",
        description: "Nenhum modelo treinado para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      systemLogger.log('model', 'Iniciando salvamento do modelo');
      
      // Salva o modelo no formato necessário para a página de jogo
      await model.save('downloads://modelo-aprendiz');
      
      systemLogger.log('model', 'Modelo salvo com sucesso');
      
      toast({
        title: "Modelo Salvo",
        description: "Arquivos modelo-aprendiz.json e modelo-aprendiz.weights.bin gerados"
      });
    } catch (error) {
      systemLogger.error('model', 'Erro ao salvar modelo', { error });
      toast({
        title: "Erro ao Salvar",
        description: "Falha ao gerar arquivos do modelo",
        variant: "destructive"
      });
    }
  };

  const trainModel = async () => {
    if (!trainingData.length) return;

    setIsTraining(true);
    setProgress(0);
    setTrainingLogs([]);

    try {
      systemLogger.log('training', 'Iniciando treinamento do modelo', {
        epochs,
        batchSize,
        dataSize: trainingData.length
      });

      const model = createEnhancedModel();
      
      const features = trainingData.map((numbers, i) => {
        const allFeatures = extractFeatures(numbers, dates[i], trainingData);
        return [
          ...allFeatures.baseFeatures,
          ...allFeatures.temporalFeatures,
          ...allFeatures.lunarFeatures,
          ...allFeatures.statisticalFeatures
        ];
      });

      const labels = trainingData.map(numbers => 
        numbers.map(n => n / 25)
      );

      // Validação cruzada
      const metrics = await performCrossValidation(model, features, labels);
      setValidationMetrics(metrics);

      systemLogger.log('training', 'Validação cruzada concluída', { metrics });

      await model.fit(tf.tensor2d(features), tf.tensor2d(labels), {
        epochs: epochs,
        batchSize: parseInt(batchSize),
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = ((epoch + 1) / epochs) * 100;
            setProgress(progress);
            if (logs) {
              setTrainingLogs(prevLogs => [...prevLogs, {
                epoch: epoch + 1,
                loss: logs.loss,
                val_loss: logs.val_loss,
                accuracy: logs.acc,
                val_accuracy: logs.val_acc
              }]);
              
              systemLogger.log('training', `Época ${epoch + 1}`, { 
                loss: logs.loss,
                val_loss: logs.val_loss,
                accuracy: logs.acc,
                convergenceRate: epoch > 0 ? 
                  (prevLogs[prevLogs.length - 1].loss - logs.loss) / prevLogs[prevLogs.length - 1].loss : 
                  0
              });
            }
          }
        }
      });

      setModel(model);
      
      systemLogger.log('training', 'Treinamento concluído', {
        finalLoss: trainingLogs[trainingLogs.length - 1]?.loss,
        totalEpochs: epochs
      });

      toast({
        title: "Treinamento Concluído",
        description: "Modelo treinado com sucesso!"
      });
    } catch (error) {
      systemLogger.error('training', 'Erro no treinamento', { error });
      toast({
        title: "Erro no Treinamento",
        description: "Falha ao treinar modelo",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Treinamento Avançado</h1>
      
      <div className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />

        <TrainingControls
          epochs={epochs}
          setEpochs={setEpochs}
          batchSize={batchSize}
          setBatchSize={setBatchSize}
        />

        {validationMetrics.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Média de Precisão na Validação: {
                (validationMetrics.reduce((acc, curr) => acc + curr.accuracy, 0) / validationMetrics.length * 100).toFixed(2)
              }%
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={trainModel}
            disabled={isTraining || !trainingData.length}
            className="flex-1"
          >
            {isTraining ? "Treinando..." : "Iniciar Treinamento"}
          </Button>

          <Button
            onClick={saveModel}
            disabled={!model}
            variant="outline"
            className="flex gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Modelo
          </Button>
        </div>

        {isTraining && (
          <TrainingProgress trainingProgress={progress} />
        )}

        {trainingLogs.length > 0 && (
          <TrainingChart logs={trainingLogs} />
        )}
      </div>
    </Card>
  );
};

export default TrainingPage;