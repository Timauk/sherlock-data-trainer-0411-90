import React from 'react';
import ChampionPredictions from '../ChampionPredictions';
import GeneticTreeVisualization from '../GeneticTreeVisualization';
import AnalysisTabs from '../GameAnalysis/AnalysisTabs';
import { Player } from '@/types/gameTypes';

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
  neuralNetworkVisualization: any;
  concursoNumber: number;
  currentCycle: number;
  lastCloneCycle: number;
  onClonePlayer: (player: Player) => void;
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
  currentCycle,
  lastCloneCycle,
  onClonePlayer
}) => {
  return (
    <div className="space-y-4">
      <GeneticTreeVisualization 
        players={players}
        generation={generation}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChampionPredictions
          champion={champion}
          trainedModel={trainedModel}
          lastConcursoNumbers={boardNumbers}
          isServerProcessing={isServerProcessing}
        />
      </div>

      <AnalysisTabs
        boardNumbers={boardNumbers}
        concursoNumber={concursoNumber}
        players={players}
        evolutionData={evolutionData}
        dates={dates}
        numbers={numbers}
        updateFrequencyData={function(){}}
        modelMetrics={modelMetrics}
        neuralNetworkVisualization={neuralNetworkVisualization}
        currentCycle={currentCycle}
        lastCloneCycle={lastCloneCycle}
        onClonePlayer={onClonePlayer}
      />
    </div>
  );
};

export default AnalysisPanel;