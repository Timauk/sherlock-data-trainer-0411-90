import React from 'react';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber }) => {
  const isSimulated = numbers.length === 0 || concursoNumber > 3184;

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">
        Quadro (Banca) - Concurso #{concursoNumber}
        {isSimulated && (
          <span className="ml-2 text-sm text-red-500 font-normal">
            (Simulação - Além dos dados reais)
          </span>
        )}
      </h3>
      <div className="bg-gray-100 p-4 rounded-lg">
        {numbers.length > 0 ? (
          numbers.map((number, index) => (
            <span key={index} className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
              {number}
            </span>
          ))
        ) : (
          <span className="text-gray-500">Nenhum número disponível</span>
        )}
      </div>
    </div>
  );
};

export default BoardDisplay;