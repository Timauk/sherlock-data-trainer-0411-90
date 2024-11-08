import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Trophy } from 'lucide-react';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber }) => {
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);

  useEffect(() => {
    console.log('BoardDisplay received new numbers:', numbers, 'for concurso:', concursoNumber);
    if (numbers && numbers.length > 0) {
      setDisplayNumbers([...numbers]);
    } else {
      setDisplayNumbers([]);
    }
  }, [numbers, concursoNumber]);

  return (
    <Card className="mb-4 p-4 bg-card">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Quadro (Banca) - Concurso #{concursoNumber}
        {displayNumbers.length === 0 && (
          <span className="text-sm text-destructive font-normal">
            (Aguardando números)
          </span>
        )}
      </h3>
      <div className="flex flex-wrap gap-2">
        {displayNumbers && displayNumbers.length > 0 ? (
          displayNumbers.map((number, index) => (
            <span 
              key={`board-${concursoNumber}-${number}-${index}`}
              className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-semibold"
            >
              {number}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">Nenhum número disponível</span>
        )}
      </div>
    </Card>
  );
};

export default BoardDisplay;