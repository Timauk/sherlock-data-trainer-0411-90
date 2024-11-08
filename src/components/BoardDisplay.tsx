import React from 'react';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber }) => {
  return (
    <div className="mb-4 p-4 bg-card rounded-lg border">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        Quadro (Banca) - Concurso #{concursoNumber}
        {numbers.length === 0 && (
          <span className="text-sm text-destructive font-normal">
            (Aguardando números)
          </span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2">
        {numbers && numbers.length > 0 ? (
          numbers.map((number, index) => (
            <span 
              key={index} 
              className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-semibold"
            >
              {number}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">Nenhum número disponível</span>
        )}
      </div>
    </div>
  );
};

export default BoardDisplay;