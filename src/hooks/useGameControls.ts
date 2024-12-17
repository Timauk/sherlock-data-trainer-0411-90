import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export const useGameControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(1);
  const { toast } = useToast();

  const playGame = useCallback(() => {
    setIsPlaying(true);
    toast({
      title: "Jogo Iniciado",
      description: "O jogo está em execução",
    });
  }, [toast]);

  const pauseGame = useCallback(() => {
    setIsPlaying(false);
    toast({
      title: "Jogo Pausado",
      description: "O jogo foi pausado",
    });
  }, [toast]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    setCurrentGeneration(1);
    toast({
      title: "Jogo Reiniciado",
      description: "O jogo foi reiniciado",
    });
  }, [toast]);

  const nextGeneration = useCallback(() => {
    setCurrentGeneration(prev => prev + 1);
  }, []);

  return {
    isPlaying,
    currentGeneration,
    playGame,
    pauseGame,
    resetGame,
    nextGeneration
  };
};