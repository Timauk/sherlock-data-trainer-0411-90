import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();
  
  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3001/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          if (status === 'offline') {
            toast({
              title: "Servidor Conectado",
              description: "Conexão estabelecida com sucesso.",
            });
          }
          setStatus('online');
        } else {
          throw new Error('Status do servidor não é online');
        }
      } else {
        throw new Error('Resposta do servidor não ok');
      }
    } catch (error) {
      if (status !== 'offline') {
        toast({
          title: "Servidor Desconectado",
          description: "Execute o arquivo start-dev.bat para iniciar o servidor",
          variant: "destructive",
        });
        setStatus('offline');
      }
    }
  };

  useEffect(() => {
    // Verificação inicial
    checkServerStatus();

    // Verificações periódicas
    const interval = setInterval(checkServerStatus, 5000);

    // Adiciona listener para reconexão após foco na janela
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]); 

  return { status, checkServerStatus };
};