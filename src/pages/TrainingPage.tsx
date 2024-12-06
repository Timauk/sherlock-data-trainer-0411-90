import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as tf from '@tensorflow/tfjs';
import { useToast } from "@/hooks/use-toast";
import TrainingChart from '@/components/TrainingChart';
import { processarCSV } from '@/utils/dataProcessing';
import { enrichTrainingData } from '@/utils/features/lotteryFeatureEngineering';
import { extractDateFromCSV } from '@/utils/csvUtils';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingProgress from '@/components/training/TrainingProgress';
import TrainingActions from '@/components/training/TrainingActions';

const TrainingPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [logs, setLogs] = useState<{ epoch: number; loss: number; val_loss: number }[]>([]);
  const [batchSize, setBatchSize] = useState<string>("16");
  const [epochs, setEpochs] = useState<number>(100);
  const { toast } = useToast();

  const { data: trainingData, isLoading, isError } = useQuery({
    queryKey: ['trainingData', file],
    queryFn: async () => {
      if (!file) return null;
      const text = await file.text();
      const numbers = processarCSV(text);
      const dates = extractDateFromCSV(text);
      const enrichedData = enrichTrainingData(numbers, dates);
      
      console.log('Dados de treinamento processados:', {
        originalLength: numbers.length,
        enrichedLength: enrichedData.length,
        featuresPerGame: enrichedData[0].length
      });
      
      return enrichedData;
    },
    enabled: !!file,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const startTraining = async () => {
    if (!trainingData) return;

    try {
      console.log('Iniciando treinamento com dados enriquecidos:', {
        amostras: trainingData.length,
        caracteristicas: trainingData[0].length
      });

      const xs = tf.tensor2d(trainingData.map(d => d.slice(15))); // Características após os 15 números originais
      const ys = tf.tensor2d(trainingData.map(d => d.slice(0, 15))); // 15 números originais

      console.log('Tensores criados:', {
        entrada: xs.shape,
        saida: ys.shape
      });

      const newModel = tf.sequential();
      
      // Primeira camada com mais unidades
      newModel.add(tf.layers.dense({ 
        units: 1024,
        activation: 'relu',
        inputShape: [xs.shape[1]],
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      newModel.add(tf.layers.batchNormalization());
      newModel.add(tf.layers.dropout({ rate: 0.4 }));
      
      // Segunda camada
      newModel.add(tf.layers.dense({ 
        units: 512,
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      newModel.add(tf.layers.batchNormalization());
      newModel.add(tf.layers.dropout({ rate: 0.3 }));

      // Terceira camada
      newModel.add(tf.layers.dense({ 
        units: 256,
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      newModel.add(tf.layers.batchNormalization());
      newModel.add(tf.layers.dropout({ rate: 0.3 }));

      // Quarta camada
      newModel.add(tf.layers.dense({ 
        units: 128,
        activation: 'relu',
        kernelInitializer: 'glorotNormal',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      newModel.add(tf.layers.batchNormalization());
      newModel.add(tf.layers.dropout({ rate: 0.2 }));

      // Quinta camada
      newModel.add(tf.layers.dense({ 
        units: 64,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
      }));
      
      // Camada de saída
      newModel.add(tf.layers.dense({ 
        units: 15,
        activation: 'softmax', // Mudado para softmax
        kernelInitializer: 'glorotNormal'
      }));

      newModel.compile({
        optimizer: tf.train.adam(0.0005),
        loss: 'categoricalCrossentropy', // Mudado para categorical crossentropy
        metrics: ['accuracy']
      });

      console.log('Modelo compilado com arquitetura:');
      newModel.summary();
      
      const result = await newModel.fit(xs, ys, {
        epochs: epochs,
        batchSize: parseInt(batchSize),
        validationSplit: 0.1,
        callbacks: {
          onEpochBegin: async (epoch) => {
            console.log(`Iniciando época ${epoch + 1}`);
          },
          onEpochEnd: (epoch, log) => {
            if (log) {
              console.log(`Época ${epoch + 1} finalizada:`, log);
              setTrainingProgress(Math.floor(((epoch + 1) / epochs) * 100));
              setLogs(prevLogs => [...prevLogs, { 
                epoch: epoch + 1, 
                loss: log.loss, 
                val_loss: log.val_loss 
              }]);
            }
          }
        }
      });

      setModel(newModel);
      toast({
        title: "Treinamento Concluído",
        description: "O modelo foi treinado com sucesso usando características enriquecidas.",
      });

      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error('Erro durante o treinamento:', error);
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const saveModel = async () => {
    if (model) {
      try {
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
      
      <TrainingControls 
        batchSize={batchSize}
        setBatchSize={setBatchSize}
        epochs={epochs}
        setEpochs={setEpochs}
      />

      <TrainingActions 
        startTraining={startTraining}
        saveModel={saveModel}
        trainingData={trainingData}
        model={model}
        handleFileUpload={handleFileUpload}
      />

      <TrainingProgress trainingProgress={trainingProgress} />

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Gráfico de Perda de Treinamento e Validação</h3>
        <TrainingChart logs={logs} />
      </div>
    </div>
  );
};

export default TrainingPage;