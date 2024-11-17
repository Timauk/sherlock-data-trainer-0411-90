import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Trophy, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoardDisplayProps {
  numbers: number[];
  concursoNumber: number;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({ numbers, concursoNumber }) => {
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (Array.isArray(numbers) && numbers.length > 0) {
      setIsUpdating(true);
      setDisplayNumbers(numbers);
      
      // Reset updating state after animation
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [numbers, concursoNumber]);

  return (
    <Card className={`mb-4 p-4 bg-card transition-colors duration-300 ${isUpdating ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        Quadro (Banca) - Concurso #{concursoNumber}
        {isUpdating && (
          <Timer className="h-4 w-4 text-green-500 animate-spin" />
        )}
      </h3>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {displayNumbers && displayNumbers.length > 0 ? (
            displayNumbers.map((number, index) => (
              <motion.span 
                key={`board-${concursoNumber}-${number}-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="inline-flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-semibold"
              >
                {number}
              </motion.span>
            ))
          ) : (
            <span className="text-muted-foreground">Carregando números do concurso...</span>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

export default BoardDisplay;