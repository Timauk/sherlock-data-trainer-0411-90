import { useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import { useGameState } from './useGameState';

export const useGameActions = (gameState: ReturnType<typeof useGameState>) => {
  const { toast } = useToast();
  const {
    setPlayers,
    setEvolutionData,
    setIsManualMode,
    setTrainingData,
  } = gameState;

  const addLog = useCallback((message: string, matches?: number) => {
    console.log(message);
  }, []);

  const evolveGeneration = useCallback(() => {
    console.log("Evolving generation...");
  }, []);

  const toggleManualMode = useCallback(() => {
    setIsManualMode(prev => !prev);
  }, [setIsManualMode]);

  const clonePlayer = useCallback((player: Player) => {
    console.log("Cloning player...");
  }, []);

  const updateFrequencyData = useCallback(() => {
    console.log("Updating frequency data...");
  }, []);

  return {
    addLog,
    evolveGeneration,
    toggleManualMode,
    clonePlayer,
    updateFrequencyData
  };
};
