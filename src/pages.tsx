Here's the complete code for src/pages.tsx:

```typescript
import React, { useState, useEffect } from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Services } from './services';
import { useToast } from './toast';
import { useGameLogic, useGameControls, useModelTraining } from './hooks';
import { DiagnosticReport, LongTermMonitoring } from './components';
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from './logger';

export const TrainingPage: React.FC = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingData, setTrainingData] = useState<number[][]>([]);
  const { toast } = useToast();

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const model = await Services.createSharedModel();
      const trainedModel = await Services.trainModel(model, trainingData);
      toast({
        title: "Modelo Treinado",
        description: "O modelo foi treinado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro no Treinamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <Card className="p-6">
      <h2>Treinamento do Modelo</h2>
      <Button onClick={handleTrainModel} disabled={isTraining}>
        {isTraining ? "Treinando..." : "Iniciar Treinamento"}
      </Button>
    </Card>
  );
};

export const PlayPage: React.FC = () => {
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();
  const gameLogic = useGameLogic(csvData, trainedModel);
  const { toast } = useToast();

  const handleCsvUpload = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1);
      const data = lines.map(line => {
        const values = line.split(',');
        return values.slice(2).map(Number);
      });

      setCsvData(data);
      setIsDataLoaded(true);
      
      if (data.length > 0) {
        gameLogic.setNumbers([data[0]]);
        gameLogic.initializePlayers(100);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar CSV",
        description: "Ocorreu um erro ao processar o arquivo CSV.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPlaying && csvData.length > 0 && gameLogic.numbers.length > 0) {
      intervalId = setInterval(() => {
        gameLogic.gameLoop();
        setProgress((prevProgress) => {
          const newProgress = prevProgress + (100 / csvData.length);
          if (newProgress >= 100) {
            if (!gameLogic.isManualMode) {
              gameLogic.evolveGeneration(gameLogic.players);
            }
            return gameLogic.isInfiniteMode ? 0 : 100;
          }
          return newProgress;
        });
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, gameLogic]);

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <h2>Controles do Jogo</h2>
        <div className="flex space-x-4">
          <Button onClick={isPlaying ? pauseGame : playGame}>
            {isPlaying ? "Pausar" : "Iniciar"}
          </Button>
          <Button onClick={resetGame}>Reiniciar</Button>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
          />
        </div>
        <div className="mt-4">
          <div>Progresso: {Math.round(progress)}%</div>
          <div>Geração: {gameLogic.generation}</div>
          <div>Total de Jogos: {gameLogic.gameCount}</div>
        </div>
      </Card>
      
      <DiagnosticReport modelMetrics={gameLogic.modelMetrics} />
      <LongTermMonitoring />
    </div>
  );
};

export const AnalysisPage: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const metrics = Services.getModelMetrics();
        setAnalysisData(metrics);
      } catch (error) {
        systemLogger.error('analysis', 'Error fetching analysis:', { error });
      }
    };

    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <Card className="p-4">
        <h2>Análise do Sistema</h2>
        {analysisData && (
          <div className="space-y-4">
            <div>Acurácia Global: {analysisData.accuracy}%</div>
            <div>Latência Média: {analysisData.latency}ms</div>
            <div>Uso de Memória: {analysisData.memoryUsage}MB</div>
            <div>Total de Previsões: {analysisData.predictions}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export const ConfigurationPage: React.FC = () => {
  const [config, setConfig] = useState({
    batchSize: 32,
    epochs: 50,
    learningRate: 0.001,
    validationSplit: 0.2
  });

  const handleSaveConfig = async () => {
    try {
      localStorage.setItem('modelConfig', JSON.stringify(config));
      toast({
        title: "Configuração Salva",
        description: "As configurações foram atualizadas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <Card className="p-4">
        <h2>Configurações do Modelo</h2>
        <div className="space-y-4">
          <div>
            <label>Batch Size:</label>
            <input
              type="number"
              value={config.batchSize}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                batchSize: parseInt(e.target.value)
              }))}
              className="ml-2"
            />
          </div>
          <div>
            <label>Epochs:</label>
            <input
              type="number"
              value={config.epochs}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                epochs: parseInt(e.target.value)
              }))}
              className="ml-2"
            />
          </div>
          <Button onClick={handleSaveConfig}>Salvar Configurações</Button>
        </div>
      </Card>
    </div>
  );
};
```