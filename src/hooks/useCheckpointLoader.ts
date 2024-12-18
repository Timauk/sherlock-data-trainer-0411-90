import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useCheckpointLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadCheckpoint = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/checkpoint/latest');
      if (!response.ok) {
        throw new Error('Falha ao carregar checkpoint');
      }
      const checkpoint = await response.json();
      return checkpoint;
    } catch (error) {
      toast({
        title: "Erro ao Carregar Checkpoint",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loadCheckpoint,
    isLoading
  };
};