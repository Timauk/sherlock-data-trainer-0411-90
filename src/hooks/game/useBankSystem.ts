import { useState, useCallback } from 'react';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useBankSystem = () => {
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [numbers, setNumbers] = useState<number[][]>([]);
  const [dates, setDates] = useState<Date[]>([]);

  const updateBank = useCallback((newNumbers: number[], newConcurso: number) => {
    setBoardNumbers(newNumbers);
    setConcursoNumber(newConcurso);
    setNumbers(prev => [...prev, newNumbers].slice(-100));
    setDates(prev => [...prev, new Date()].slice(-100));

    systemLogger.log('bank', 'Banca atualizada', {
      concurso: newConcurso,
      numbers: newNumbers
    });
  }, []);

  return {
    boardNumbers,
    concursoNumber,
    numbers,
    dates,
    setNumbers,
    setBoardNumbers,
    setConcursoNumber,
    setDates,
    updateBank
  };
};