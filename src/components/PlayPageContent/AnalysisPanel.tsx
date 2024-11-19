import React from 'react';
import { Card } from "@/components/ui/card";
import TotalFitnessChart from '../TotalFitnessChart';
import AnalysisTabs from '../GameAnalysis/AnalysisTabs';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface AnalysisPanelProps {
  champion: any;
  trainedModel: any;
  boardNumbers: number[];
  isServerProcessing: boolean;
  players: any[];
  generation: number;
  evolutionData: any[];
  dates: Date[];
  numbers: number[][];
  modelMetrics: any;
  neuralNetworkVisualization?: any;
  concursoNumber: number;
  onExportCSV?: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  champion,
  trainedModel,
  boardNumbers,
  isServerProcessing,
  players,
  generation,
  evolutionData,
  dates,
  numbers,
  modelMetrics,
  neuralNetworkVisualization,
  concursoNumber,
  onExportCSV
}) => {
  const fitnessData = evolutionData.map(data => ({
    gameNumber: data.generation,
    totalFitness: data.fitness
  }));

  const lastConcursoNumbers = numbers[numbers.length - 1] || [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Análise do Jogo</h2>
          {onExportCSV && (
            <Button 
              variant="outline" 
              onClick={onExportCSV}
              className="ml-auto"
            >
              Exportar CSV
            </Button>
          )}
        </div>
        
        <AnalysisTabs
          boardNumbers={boardNumbers}
          concursoNumber={concursoNumber}
          players={players}
          evolutionData={evolutionData}
          dates={dates}
          numbers={numbers}
          updateFrequencyData={() => {}}
          modelMetrics={modelMetrics}
          neuralNetworkVisualization={neuralNetworkVisualization}
          champion={champion}
          trainedModel={trainedModel}
          lastConcursoNumbers={lastConcursoNumbers}
        />
      </Card>

      <Separator className="my-8" />
      
      <div className="space-y-8">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Gráficos de Análise</h3>
          <div className="space-y-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Evolução do Fitness</h4>
              <TotalFitnessChart fitnessData={fitnessData} />
            </div>
            {neuralNetworkVisualization && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Visualização da Rede Neural</h4>
                {neuralNetworkVisualization}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisPanel;