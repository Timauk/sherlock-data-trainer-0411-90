import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Player } from '@/types/gameTypes';
import GameBoard from '../GameBoard';
import SystemDiagnostics from '../SystemDiagnostics';
import EnhancedLogDisplay from '../EnhancedLogDisplay';
import NeuralNetworkVisualization from '../NeuralNetworkVisualization';
import ModelMetrics from '../ModelMetrics';
import LunarAnalysis from '../LunarAnalysis';
import FrequencyAnalysis from '../FrequencyAnalysis';
import AdvancedAnalysis from '../AdvancedAnalysis';

interface AnalysisTabsProps {
  boardNumbers: number[];
  concursoNumber: number;
  players: Player[];
  evolutionData: any[];
  dates: Date[];
  numbers: number[][];
  updateFrequencyData: (data: { [key: string]: number[] }) => void;
  modelMetrics: {
    accuracy: number;
    randomAccuracy: number;
    totalPredictions: number;
  };
  neuralNetworkVisualization?: {
    input?: number[];
    output?: number[];
  };
}

const AnalysisTabs: React.FC<AnalysisTabsProps> = ({
  boardNumbers,
  concursoNumber,
  players,
  evolutionData,
  dates,
  numbers,
  updateFrequencyData,
  modelMetrics,
  neuralNetworkVisualization
}) => {
  return (
    <Tabs defaultValue="game" className="w-full">
      <TabsList>
        <TabsTrigger value="game">Jogo</TabsTrigger>
        <TabsTrigger value="analysis">Análise</TabsTrigger>
        <TabsTrigger value="neural">Rede Neural</TabsTrigger>
        <TabsTrigger value="diagnostics">Diagnóstico</TabsTrigger>
      </TabsList>

      <TabsContent value="game">
        <div className="space-y-4">
          <GameBoard
            boardNumbers={boardNumbers}
            concursoNumber={concursoNumber}
            players={players}
            evolutionData={evolutionData}
          />
          <EnhancedLogDisplay />
        </div>
      </TabsContent>

      <TabsContent value="analysis">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LunarAnalysis dates={dates} numbers={numbers} recentResults={100} />
          <FrequencyAnalysis numbers={numbers} onFrequencyUpdate={updateFrequencyData} />
          <AdvancedAnalysis numbers={numbers} dates={dates} />
          <ModelMetrics {...modelMetrics} />
        </div>
      </TabsContent>

      <TabsContent value="neural">
        <NeuralNetworkVisualization 
          layers={[15, 64, 32, 15]} 
          inputData={neuralNetworkVisualization?.input}
          outputData={neuralNetworkVisualization?.output}
        />
      </TabsContent>

      <TabsContent value="diagnostics">
        <SystemDiagnostics />
      </TabsContent>
    </Tabs>
  );
};

export default AnalysisTabs;