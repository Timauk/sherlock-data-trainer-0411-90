import React from 'react';
import { temporalAccuracyTracker } from '@/utils/predictions/predictionCore';

const RealTimeFeedback: React.FC = () => {
  const averageAccuracy = temporalAccuracyTracker.getAverageAccuracy();

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold">Feedback em Tempo Real</h2>
      <p className="mt-2">Precisão Média: {(averageAccuracy * 100).toFixed(2)}%</p>
    </div>
  );
};

export default RealTimeFeedback;
