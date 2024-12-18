import React from 'react';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
  totalGames?: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber, totalGames = 0 }) => {
  const isSimulated = numbers.length === 0;

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-4">
        <span>
          Quadro (Banca) - Concurso #{concursoNumber}
          {isSimulated && (
            <span className="ml-2 text-sm text-red-500 font-normal">
              (Simulação)
            </span>
          )}
        </span>
        <span className="text-sm font-normal text-muted-foreground">
          Total de Jogos: {totalGames}
        </span>
      </h3>
      <div className="bg-gray-100 p-4 rounded-lg">
        {numbers.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {numbers.map((number, index) => (
                <span 
                  key={index} 
                  className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold"
                >
                  {number.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Nenhum número disponível</span>
        )}
      </div>
    </div>
  );
};

export default BoardDisplay;