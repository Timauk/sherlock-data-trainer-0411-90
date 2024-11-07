import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Player } from '@/types/gameTypes';
import GameBoard from '../GameBoard';
import SystemDiagnostics from '../SystemDiagnostics';

const EnhancedLogDisplay = React.lazy(() => import('../EnhancedLogDisplay'));
const NeuralNetworkVisualization = React.lazy(() => import('../NeuralNetworkVisualization'));
const ModelMetrics = React.lazy(() => import('../ModelMetrics'));
const LunarAnalysis = React.lazy(() => import('../LunarAnalysis'));
const FrequencyAnalysis = React.lazy(() => import('../FrequencyAnalysis'));
const AdvancedAnalysis = React.lazy(() => import('../AdvancedAnalysis'));

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

const LoadingFallback = () => (
  <div className="w-full space-y-3">
    <Skeleton className="h-[125px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </div>
  </div>
);

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
        <Suspense fallback={<LoadingFallback />}>
          <div className="space-y-4">
            <GameBoard
              boardNumbers={boardNumbers}
              concursoNumber={concursoNumber}
              players={players}
              evolutionData={evolutionData}
            />
            <EnhancedLogDisplay />
          </div>
        </Suspense>
      </TabsContent>

      <TabsContent value="analysis">
        <Suspense fallback={<LoadingFallback />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LunarAnalysis dates={dates} numbers={numbers} recentResults={100} />
            <FrequencyAnalysis numbers={numbers} onFrequencyUpdate={updateFrequencyData} />
            <AdvancedAnalysis numbers={numbers} dates={dates} />
            <ModelMetrics {...modelMetrics} />
          </div>
        </Suspense>
      </TabsContent>

      <TabsContent value="neural">
        <Suspense fallback={<LoadingFallback />}>
          <NeuralNetworkVisualization 
            layers={[15, 64, 32, 15]} 
            inputData={neuralNetworkVisualization?.input}
            outputData={neuralNetworkVisualization?.output}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value="diagnostics">
        <Suspense fallback={<LoadingFallback />}>
          <SystemDiagnostics />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
};

export default AnalysisTabs;
