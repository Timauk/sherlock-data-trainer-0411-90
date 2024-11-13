import { useEffect, useRef } from 'react';

export const useGameInterval = (
  isPlaying: boolean,
  gameSpeed: number,
  gameLoop: () => Promise<boolean>,
  onGameEnd?: () => void
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clearCurrentInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (isPlaying) {
      clearCurrentInterval();
      
      const runGameLoop = async () => {
        const shouldContinue = await gameLoop();
        if (!shouldContinue) {
          clearCurrentInterval();
          onGameEnd?.();
        }
      };

      // Executa imediatamente a primeira vez
      runGameLoop();
      
      // Configura o intervalo para as próximas execuções
      intervalRef.current = setInterval(runGameLoop, gameSpeed);
    } else {
      clearCurrentInterval();
    }

    return () => clearCurrentInterval();
  }, [isPlaying, gameSpeed, gameLoop, onGameEnd]);

  return intervalRef.current !== null;
};