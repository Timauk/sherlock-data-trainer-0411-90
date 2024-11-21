import React from 'react';

interface PredictionListProps {
  predictions: Array<{
    numbers: number[];
    estimatedAccuracy: number;
    targetMatches: number;
    matchesWithSelected: number;
    isGoodDecision: boolean;
  }>;
  selectedNumbers: number[];
}

const PredictionsList: React.FC<PredictionListProps> = ({ predictions, selectedNumbers }) => {
  return (
    <div className="space-y-4">
      {predictions.map((pred, idx) => (
        <div key={idx} className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
          <div className="font-semibold mb-2">
            Jogo {idx + 1} (Objetivo: {pred.targetMatches} acertos) - Decisão Boa: {pred.isGoodDecision ? 'Sim' : 'Não'}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {pred.numbers.map((num, numIdx) => (
              <span 
                key={numIdx} 
                className={`px-3 py-1 rounded-full ${
                  selectedNumbers.includes(num) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}
              >
                {num.toString().padStart(2, '0')}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>Estimativa de Acertos: {pred.estimatedAccuracy.toFixed(2)}%</div>
            {selectedNumbers.length === 15 && (
              <div className="mt-1 font-semibold text-green-600 dark:text-green-400">
                Acertos com sua seleção: {pred.matchesWithSelected}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PredictionsList;