import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useGameControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const playGame = () => {
    setIsPlaying(true);
    toast({
      title: "Jogo Iniciado",
      description: "O jogo está em execução",
    });
  };

  const pauseGame = () => {
    setIsPlaying(false);
    toast({
      title: "Jogo Pausado",
      description: "O jogo foi pausado",
    });
  };

  const resetGame = () => {
    setIsPlaying(false);
    toast({
      title: "Jogo Reiniciado",
      description: "O jogo foi reiniciado",
    });
  };

  return {
    isPlaying,
    playGame,
    pauseGame,
    resetGame
  };
};