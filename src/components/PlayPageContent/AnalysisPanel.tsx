import React from 'react';
import { Card } from "@/components/ui/card";
import TotalScoreChart from '../TotalScoreChart';
import TotalFitnessChart from '../TotalFitnessChart';
import AnalysisTabs from '../GameAnalysis/AnalysisTabs';

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
  const scoreData = evolutionData.map(data => ({
    gameNumber: data.generation,
    totalScore: data.score
  }));

  const fitnessData = evolutionData.map(data => ({
    gameNumber: data.generation,
    totalFitness: data.fitness
  }));

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TotalScoreChart scoreData={scoreData} onExportCSV={onExportCSV} />
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