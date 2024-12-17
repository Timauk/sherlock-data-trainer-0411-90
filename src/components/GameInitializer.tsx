import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import * as tf from '@tensorflow/tfjs';
import { ModelInitializer } from '@/utils/tensorflow'; // Updated import

interface GameInitializerProps {
  csvData: number[][];
  setCsvData: (data: number[][]) => void;
  setCsvDates: (dates: Date[]) => void;
  setTrainedModel: (model: tf.LayersModel) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  gameLogic: any;
}

const GameInitializer: React.FC<GameInitializerProps> = ({
  csvData,
  setCsvData,
  setCsvDates,
  setTrainedModel,
  setIsDataLoaded,
  gameLogic
}) => {
  const { toast } = useToast();

  const initializeNeuralNetwork = async () => {
    try {
      systemLogger.log('system', 'Iniciando inicialização da rede neural');
      
      // Try WebGL first
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        systemLogger.log('system', 'Usando backend WebGL');
      } catch (webglError) {
        // Fallback to CPU if WebGL fails
        systemLogger.log('system', 'WebGL falhou, usando CPU como fallback', { error: webglError });
        await tf.setBackend('cpu');
        await tf.ready();
      }
      
      const model = await ModelInitializer.initializeModel();
      
      // Split data into smaller batches to prevent texture size issues
      const batchSize = 32;
      const totalBatches = Math.ceil(csvData.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min((i + 1) * batchSize, csvData.length);
        const batchData = csvData.slice(start, end);
        
        const xs = tf.tensor2d(batchData.map(row => row.slice(0, 15)));
        const ys = tf.tensor2d(batchData.map(row => row.slice(-15)));
        
        await model.fit(xs, ys, {
          epochs: 10,
          batchSize: Math.min(32, batchData.length),
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              systemLogger.log('system', `Época ${epoch + 1}`, { loss: logs?.loss });
            }
          }
        });

        // Clean up tensors
        xs.dispose();
        ys.dispose();
      }

      setTrainedModel(model);
      setIsDataLoaded(true);
      
      // Initialize game data and set initial numbers
      if (gameLogic.initializeGameData()) {
        gameLogic.setNumbers([csvData[0]]);
        const initializedPlayers = gameLogic.initializePlayers();
        
        systemLogger.log('system', 'Jogo inicializado com sucesso', {
          playersCount: initializedPlayers.length,
          modelStatus: model.optimizer ? 'compiled' : 'not compiled',
          firstNumbers: csvData[0]
        });
      }
      
      toast({
        title: "Modelo Neural Treinado",
        description: "O modelo foi treinado com sucesso e está pronto para iniciar o jogo.",
      });
      
    } catch (error) {
      systemLogger.error('system', 'Erro ao inicializar rede neural', { error });
      toast({
        title: "Erro no Treinamento",
        description: "Ocorreu um erro ao treinar o modelo neural. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const loadCSV = async (file: File) => {
    try {
      systemLogger.log('system', 'Iniciando carregamento do CSV', { fileName: file.name });
      const text = await file.text();
      
      const lines = text.trim().split('\n').slice(1);
      systemLogger.log('system', 'Processando linhas do CSV', { totalLines: lines.length });
      
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });

      const isValidNumbers = data.every(d => 
        d.bolas.length === 15 && 
        d.bolas.every(n => n >= 1 && n <= 25)
      );

      if (!isValidNumbers) {
        throw new Error('Números inválidos encontrados no CSV');
      }

      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));

      // Initialize neural network after CSV is loaded
      await initializeNeuralNetwork();

      toast({
        title: "Dados Carregados",
        description: `${data.length} registros foram carregados. Iniciando treinamento...`,
      });
    } catch (error) {
      systemLogger.error('system', 'Erro ao carregar CSV', { 
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Erro ao Carregar Dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return null;
};

export default GameInitializer;
