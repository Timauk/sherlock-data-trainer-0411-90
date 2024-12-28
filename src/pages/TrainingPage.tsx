import React from 'react';
import { Card } from "@/components/ui/card";
import TrainingProgress from '@/components/training/TrainingProgress';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingChart from '@/components/TrainingChart';
import TrainingLegend from '@/components/training/TrainingLegend';
import TrainingAdvancedControls from '@/components/training/TrainingAdvancedControls';
import RealTimeSuggestions from '@/components/training/RealTimeSuggestions';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { useTrainingState } from '@/hooks/useTrainingState';
import { useTrainingLogic } from '@/hooks/useTrainingLogic';

const TrainingPage: React.FC = () => {
  const {
    trainingData,
    setTrainingData,
    dates,
    setDates,
    epochs,
    setEpochs,
    batchSize,
    setBatchSize,
  } = useTrainingState();

  const [learningRate, setLearningRate] = React.useState(0.001);
  const [validationSplit, setValidationSplit] = React.useState(0.2);
  const [optimizer, setOptimizer] = React.useState("adam");
  const [useEarlyStopping, setUseEarlyStopping] = React.useState(true);
  
  const {
    isTraining,
    progress,
    model,
    trainingLogs,
    validationMetrics,
    trainModel
  } = useTrainingLogic();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      systemLogger.log('training', 'Iniciando carregamento do CSV', { 
        fileName: file.name,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      });

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
        firstSample: processedData[0].numbers,
        lastSample: processedData[processedData.length - 1].numbers,
        dataRange: {
          start: processedData[0].date,
          end: processedData[processedData.length - 1].date
        }
      });

      toast({
        title: "Dados Carregados",
        description: `${processedData.length} registros processados.`
      });
    } catch (error) {
      systemLogger.error('training', 'Erro ao carregar arquivo', { 
        error,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Erro ao Carregar Arquivo",
        description: "Formato de arquivo inválido",
        variant: "destructive"
      });
    }
  };

  const handleTrainModel = async () => {
    await trainModel(
      trainingData,
      dates,
      epochs,
      batchSize,
      learningRate,
      validationSplit,
      optimizer,
      useEarlyStopping
    );
  };

  const lastLog = trainingLogs[trainingLogs.length - 1];

  return (
    <Card className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Treinamento Avançado</h1>
      
      <TrainingLegend />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <TrainingAdvancedControls
            learningRate={learningRate}
            setLearningRate={setLearningRate}
            validationSplit={validationSplit}
            setValidationSplit={setValidationSplit}
            optimizer={optimizer}
            setOptimizer={setOptimizer}
            useEarlyStopping={useEarlyStopping}
            setUseEarlyStopping={setUseEarlyStopping}
          />

          <button
            onClick={handleTrainModel}
            disabled={isTraining || !trainingData.length}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTraining ? "Treinando..." : "Iniciar Treinamento"}
          </button>
        </div>

        <div className="space-y-4">
          {lastLog && (
            <RealTimeSuggestions
              loss={lastLog.loss}
              accuracy={lastLog.accuracy}
              valLoss={lastLog.val_loss}
              epoch={lastLog.epoch}
              convergenceRate={lastLog.convergenceRate}
            />
          )}

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
        </div>
      </div>

      {isTraining && (
        <TrainingProgress trainingProgress={progress} />
      )}

      {trainingLogs.length > 0 && (
        <TrainingChart logs={trainingLogs} />
      )}
    </Card>
  );
};

export default TrainingPage;
