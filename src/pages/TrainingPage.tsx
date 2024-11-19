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

    // Create model with exact same architecture as in utils.js
    const newModel = tf.sequential();
    
    newModel.add(tf.layers.dense({ 
      units: 256, 
      activation: 'relu', 
      inputShape: [17],
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0, l2: 0.01 }),
      useBias: true,
      biasInitializer: 'zeros'
    }));
    
    newModel.add(tf.layers.batchNormalization({
      axis: -1,
      momentum: 0.99,
      epsilon: 0.001,
      center: true,
      scale: true
    }));
    
    newModel.add(tf.layers.dropout({ rate: 0.3 }));
    
    newModel.add(tf.layers.dense({ 
      units: 128, 
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0, l2: 0.01 }),
      useBias: true,
      biasInitializer: 'zeros'
    }));
    
    newModel.add(tf.layers.batchNormalization({
      axis: -1,
      momentum: 0.99,
      epsilon: 0.001,
      center: true,
      scale: true
    }));
    
    newModel.add(tf.layers.dense({ 
      units: 15, 
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal',
      useBias: true,
      biasInitializer: 'zeros'
    }));

    newModel.compile({ 
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

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
        // Save model files with exact same structure
        const saveResult = await model.save('downloads://model');
        
        // Create metadata file
        const metadata = {
          timestamp: new Date().toISOString(),
          architecture: model.layers.map(layer => layer.getConfig()),
          metrics: {
            loss: logs[logs.length - 1]?.loss,
            val_loss: logs[logs.length - 1]?.val_loss
          },
          totalSamples: trainingData?.length || 0
        };
        
        // Save metadata
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const metadataUrl = URL.createObjectURL(metadataBlob);
        const metadataLink = document.createElement('a');
        metadataLink.href = metadataUrl;
        metadataLink.download = 'metadata.json';
        metadataLink.click();

        // Save weight specs
        const weightSpecs = model.weights.map(w => ({
          name: w.name,
          shape: w.shape,
          dtype: w.dtype
        }));
        const weightSpecsBlob = new Blob([JSON.stringify(weightSpecs)], { type: 'application/json' });
        const weightSpecsUrl = URL.createObjectURL(weightSpecsBlob);
        const weightSpecsLink = document.createElement('a');
        weightSpecsLink.href = weightSpecsUrl;
        weightSpecsLink.download = 'weight-specs.json';
        weightSpecsLink.click();
        
        toast({
          title: "Modelo Salvo",
          description: "O modelo e seus metadados foram salvos com sucesso!",
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
          Salvar Modelo Treinado
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