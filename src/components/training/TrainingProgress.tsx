import React from 'react';
import { Progress } from "@/components/ui/progress";

interface TrainingProgressProps {
  trainingProgress: number;
}

const TrainingProgress: React.FC<TrainingProgressProps> = ({ trainingProgress }) => {
  return (
    <div className="mt-4">
      <Progress value={trainingProgress} className="w-full" />
      <p className="text-center mt-2 text-sm text-muted-foreground">
        {Math.round(trainingProgress)}% Concluído
      </p>
    </div>
  );
};

export default TrainingProgress;