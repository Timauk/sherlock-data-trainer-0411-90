import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const usePerformanceAlerts = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handlePerformanceAlert = (event: CustomEvent<{
      type: 'accuracy' | 'latency' | 'memory';
      value: number;
    }>) => {
      const { type, value } = event.detail;
      
      const messages = {
        accuracy: {
          title: "Alerta de Precisão",
          description: `A precisão do modelo está baixa: ${(value * 100).toFixed(2)}%`
        },
        latency: {
          title: "Alerta de Latência",
          description: `Tempo de predição alto: ${value.toFixed(2)}ms`
        },
        memory: {
          title: "Alerta de Memória",
          description: `Uso de memória alto: ${(value * 100).toFixed(2)}%`
        }
      };

      toast({
        title: messages[type].title,
        description: messages[type].description,
        variant: "destructive"
      });
    };

    const handleModelAlert = (event: CustomEvent<{
      type: 'accuracy' | 'error' | 'memory';
      value: number;
      metrics: any;
    }>) => {
      const { type, value } = event.detail;
      
      const messages = {
        accuracy: {
          title: "Alerta de Precisão do Modelo",
          description: `Precisão abaixo do esperado: ${(value * 100).toFixed(2)}%`
        },
        error: {
          title: "Taxa de Erro Alta",
          description: `Taxa de erro: ${(value * 100).toFixed(2)}%`
        },
        memory: {
          title: "Uso de Memória Alto",
          description: `${(value * 100).toFixed(2)}% da memória em uso`
        }
      };

      toast({
        title: messages[type].title,
        description: messages[type].description,
        variant: "destructive"
      });
    };

    window.addEventListener('performanceAlert', handlePerformanceAlert as EventListener);
    window.addEventListener('modelAlert', handleModelAlert as EventListener);
    
    return () => {
      window.removeEventListener('performanceAlert', handlePerformanceAlert as EventListener);
      window.removeEventListener('modelAlert', handleModelAlert as EventListener);
    };
  }, [toast]);
};