import React from 'react';
import { Progress } from "@/components/ui/progress";

interface TrainingProgressProps {
  trainingProgress: number;
}

const TrainingProgress: React.FC<TrainingProgressProps> = ({ trainingProgress }) => {
  return trainingProgress > 0 ? (
    <div className="mt-4">
      <Progress value={trainingProgress} className="w-full" />
      <p className="text-center mt-2">{trainingProgress}% Concluído</p>
    </div>
  ) : null;
};

export default TrainingProgress;