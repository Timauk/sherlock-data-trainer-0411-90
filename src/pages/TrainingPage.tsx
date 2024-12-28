import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';
import TrainingProgress from '@/components/training/TrainingProgress';
import TrainingControls from '@/components/training/TrainingControls';
import TrainingChart from '@/components/TrainingChart';
import TrainingLegend from '@/components/training/TrainingLegend';
import TrainingAdvancedControls from '@/components/training/TrainingAdvancedControls';
import RealTimeSuggestions from '@/components/training/RealTimeSuggestions';
import { extractFeatures } from '@/utils/features/featureEngineering';
import { createEnhancedModel } from '@/utils/training/modelArchitecture';
import { performCrossValidation } from '@/utils/training/crossValidation';
import { Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as tf from '@tensorflow/tfjs';
import { useTrainingState } from '@/hooks/useTrainingState';
import type { TrainingLog } from '@/types/training';

const TrainingPage: React.FC = () => {
  const {
    trainingData,
    setTrainingData,
    dates,
    setDates,
    isTraining,
    setIsTraining,
    progress,
    setProgress,
    model,
    setModel,
    trainingLogs,
    setTrainingLogs,
    epochs,
    setEpochs,
    batchSize,
    setBatchSize,
    validationMetrics,
    setValidationMetrics
  } = useTrainingState();

  const [learningRate, setLearningRate] = React.useState(0.001);
  const [validationSplit, setValidationSplit] = React.useState(0.2);
  const [optimizer, setOptimizer] = React.useState("adam");
  const [useEarlyStopping, setUseEarlyStopping] = React.useState(true);
  
  const { toast } = useToast();

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

  const saveModel = async () => {
    if (!model) {
      systemLogger.warn('model', 'Tentativa de salvar modelo sem treinamento');
      toast({
        title: "Erro",
        description: "Nenhum modelo treinado para salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      systemLogger.log('model', 'Iniciando salvamento do modelo', {
        timestamp: new Date().toISOString(),
        modelInfo: {
          epochs: epochs,
          batchSize: batchSize,
          finalLoss: trainingLogs[trainingLogs.length - 1]?.loss
        }
      });

      await model.save('downloads://modelo-aprendiz');
      
      systemLogger.log('model', 'Modelo salvo com sucesso', {
        files: ['modelo-aprendiz.json', 'modelo-aprendiz.weights.bin']
      });
      
      toast({
        title: "Modelo Salvo",
        description: "Arquivos modelo-aprendiz.json e modelo-aprendiz.weights.bin gerados"
      });
    } catch (error) {
      systemLogger.error('model', 'Erro ao salvar modelo', { 
        error,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Erro ao Salvar",
        description: "Falha ao gerar arquivos do modelo",
        variant: "destructive"
      });
    }
  };

  const trainModel = async () => {
    if (!trainingData.length) {
      systemLogger.warn('training', 'Tentativa de treinar sem dados');
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setTrainingLogs([]);

    try {
      systemLogger.log('training', 'Iniciando treinamento do modelo', {
        epochs,
        batchSize,
        learningRate,
        validationSplit,
        useEarlyStopping,
        dataSize: trainingData.length,
        timestamp: new Date().toISOString()
      });

      const model = createEnhancedModel(optimizer, learningRate);
      
      systemLogger.log('training', 'Iniciando extração de features', {
        dataSize: trainingData.length
      });

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

      systemLogger.log('training', 'Iniciando validação cruzada', {
        folds: 5,
        timestamp: new Date().toISOString()
      });

      const metrics = await performCrossValidation(model, features, labels);
      setValidationMetrics(metrics);

      systemLogger.log('training', 'Validação cruzada concluída', { 
        metrics,
        meanAccuracy: metrics.reduce((acc, curr) => acc + curr.accuracy, 0) / metrics.length
      });

      await model.fit(tf.tensor2d(features), tf.tensor2d(labels), {
        epochs: epochs,
        batchSize: parseInt(batchSize),
        validationSplit: validationSplit,
        callbacks: [
          ...(useEarlyStopping ? [
            tf.callbacks.earlyStopping({
              monitor: 'val_loss',
              patience: 5
            })
          ] : []),
          {
            onEpochBegin: (epoch) => {
              systemLogger.log('training', `Iniciando época ${epoch + 1}`, {
                timestamp: new Date().toISOString()
              });
            },
            onEpochEnd: (epoch, logs) => {
              const progress = ((epoch + 1) / epochs) * 100;
              setProgress(progress);
              
              if (logs) {
                const convergenceRate = epoch > 0 && trainingLogs.length > 0 ? 
                  (trainingLogs[trainingLogs.length - 1].loss - logs.loss) / trainingLogs[trainingLogs.length - 1].loss : 
                  0;

                setTrainingLogs(currentLogs => [...currentLogs, {
                  epoch: epoch + 1,
                  loss: logs.loss,
                  val_loss: logs.val_loss,
                  accuracy: logs.acc,
                  val_accuracy: logs.val_acc,
                  convergenceRate
                }]);
                
                systemLogger.log('training', `Época ${epoch + 1} finalizada`, { 
                  ...logs,
                  convergenceRate,
                  progress: `${progress.toFixed(2)}%`,
                  timeElapsed: new Date().toISOString()
                });
              }
            }
          }
        ]
      });

      setModel(model);
      
      systemLogger.log('training', 'Treinamento concluído', {
        finalLoss: trainingLogs[trainingLogs.length - 1]?.loss,
        totalEpochs: epochs,
        finalAccuracy: trainingLogs[trainingLogs.length - 1]?.accuracy,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Treinamento Concluído",
        description: "Modelo treinado com sucesso!"
      });
    } catch (error) {
      systemLogger.error('training', 'Erro no treinamento', { 
        error,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Erro no Treinamento",
        description: "Falha ao treinar modelo",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
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
