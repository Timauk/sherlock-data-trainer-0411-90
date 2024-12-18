import React, { useState, useCallback } from 'react';
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
import * as tf from '@tensorflow/tfjs';

const TrainingPage: React.FC = () => {
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
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

      toast({
        title: "Dados Carregados",
        description: `${processedData.length} registros processados.`
      });
    } catch (error) {
      toast({
        title: "Erro ao Carregar Arquivo",
        description: "Formato de arquivo inválido",
        variant: "destructive"
      });
    }
  };

  const trainModel = async () => {
    if (!trainingData.length) return;

    setIsTraining(true);
    setProgress(0);

    try {
      // Criar modelo
      const model = createEnhancedModel();
      
      // Preparar features
      const features = trainingData.map((numbers, i) => {
        const allFeatures = extractFeatures(numbers, dates[i], trainingData);
        return [
          ...allFeatures.baseFeatures,
          ...allFeatures.temporalFeatures,
          ...allFeatures.lunarFeatures,
          ...allFeatures.statisticalFeatures
        ];
      });

      // Preparar labels (saída esperada 1-15)
      const labels = trainingData.map(numbers => 
        numbers.map(n => n / 25) // Normalizar para [0,1]
      );

      // Cross-validation
      const validationMetrics = await performCrossValidation(
        model,
        features,
        labels
      );

      // Treinamento final
      await model.fit(tf.tensor2d(features), tf.tensor2d(labels), {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            const progress = ((epoch + 1) / 50) * 100;
            setProgress(progress);
            systemLogger.log('training', `Época ${epoch + 1}`, { logs });
          }
        }
      });

      // Salvar modelo
      await model.save('indexeddb://lottery-model');
      setModel(model);

      toast({
        title: "Treinamento Concluído",
        description: "Modelo treinado e salvo com sucesso!"
      });
    } catch (error) {
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

        <Button
          onClick={trainModel}
          disabled={isTraining || !trainingData.length}
          className="w-full"
        >
          {isTraining ? "Treinando..." : "Iniciar Treinamento"}
        </Button>

        {isTraining && (
          <TrainingProgress progress={progress} />
        )}

        <TrainingChart />
      </div>
    </Card>
  );
};

export default TrainingPage;