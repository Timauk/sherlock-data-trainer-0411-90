import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as tf from '@tensorflow/tfjs';
import { Upload, BarChart2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import TrainingChart from '@/components/TrainingChart';
import { processarCSV } from '@/utils/dataProcessing';
import { useToast } from "@/hooks/use-toast";

const TrainingPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [logs, setLogs] = useState<{ epoch: number; loss: number; val_loss: number }[]>([]);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const { data: trainingData, isLoading, isError } = useQuery({
    queryKey: ['trainingData', file],
    queryFn: async () => {
      if (!file) return null;
      const text = await file.text();
      return processarCSV(text);
    },
    enabled: !!file,
  });

  const startTraining = async () => {
    if (!trainingData) return;

    const numeroDeBolas = trainingData[0].bolas.length;

    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [numeroDeBolas + 2] }));
    newModel.add(tf.layers.batchNormalization());
    newModel.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    newModel.add(tf.layers.dense({ units: numeroDeBolas, activation: 'sigmoid' }));

    newModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    const xs = tf.tensor2d(trainingData.map(d => [...d.bolas, d.numeroConcurso, d.dataSorteio]));
    const ys = tf.tensor2d(trainingData.map(d => d.bolas));

    await newModel.fit(xs, ys, {
      epochs: 100,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, log) => {
          if (log) {
            setTrainingProgress(Math.floor(((epoch + 1) / 100) * 100));
            setLogs(prevLogs => [...prevLogs, { epoch: epoch + 1, loss: log.loss, val_loss: log.val_loss }]);
          }
        }
      }
    });

    setModel(newModel);
  };

  const saveModel = async () => {
    if (model) {
      try {
        // Salva o modelo completo (arquitetura + pesos)
        await model.save('downloads://modelo-aprendiz');
        
        toast({
          title: "Modelo Base Salvo",
          description: "O modelo base e seus pesos foram salvos com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro ao Salvar",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Página de Treinamento</h2>
      
      <div className="mb-4">
        <label htmlFor="fileInput" className="block mb-2">Carregar dados (CSV):</label>
        <input
          type="file"
          id="fileInput"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <div className="space-y-4">
        <Button
          onClick={startTraining}
          disabled={!trainingData}
          className="w-full"
        >
          <BarChart2 className="inline-block mr-2" />
          Iniciar Treinamento
        </Button>

        <Button
          onClick={saveModel}
          disabled={!model}
          className="w-full"
        >
          <Save className="inline-block mr-2" />
          Salvar Modelo Base
        </Button>
      </div>

      {trainingProgress > 0 && (
        <div className="mt-4">
          <Progress value={trainingProgress} className="w-full" />
          <p className="text-center mt-2">{trainingProgress}% Concluído</p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Gráfico de Perda de Treinamento e Validação</h3>
        <TrainingChart logs={logs} />
      </div>
    </div>
  );
};

export default TrainingPage;