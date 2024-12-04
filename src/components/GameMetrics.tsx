import React from 'react';
import { Progress } from "@/components/ui/progress";
import RealTimeFeedback from './RealTimeFeedback';
import { Player } from '@/types/gameTypes';

interface GameMetricsProps {
  progress: number;
  champion: Player | null;
  modelMetrics: {
    accuracy: number;
    predictionConfidence?: number;
  } | null;
}

const GameMetrics: React.FC<GameMetricsProps> = ({ progress, champion, modelMetrics }) => {
  return (
    <div className="space-y-4">
      <Progress value={progress} className="w-full" />
      <RealTimeFeedback
        accuracy={modelMetrics?.accuracy ? modelMetrics.accuracy * 100 : 0}
        predictionConfidence={champion?.fitness ? champion.fitness * 100 : 0}
        processingSpeed={90}
        memoryUsage={75}
      />
    </div>
  );
};

export default GameMetrics;