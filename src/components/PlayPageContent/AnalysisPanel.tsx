import React from 'react';
import { Card } from "@/components/ui/card";
import TotalFitnessChart from '../TotalFitnessChart';
import AnalysisTabs from '../GameAnalysis/AnalysisTabs';
import { Button } from "@/components/ui/button";

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

  return (
    <Card className="p-6">
      <div className="flex justify-end mb-4">
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
      
      <div className="mb-4">
        <TotalFitnessChart fitnessData={fitnessData} />
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
      />
    </Card>
  );
};

export default AnalysisPanel;