import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          setStatus('online');
          if (status === 'offline') {
            systemLogger.log('system', 'Server connection restored', {}, 'success');
            toast({
              title: "Servidor Conectado",
              description: "Conexão estabelecida com sucesso.",
            });
          }
        } else {
          throw new Error('Status do servidor não é online');
        }
      } else {
        throw new Error('Resposta do servidor não ok');
      }
    } catch (error) {
      setStatus('offline');
      if (status === 'online') {
        systemLogger.log('system', 'Server connection lost', {}, 'error');
        toast({
          title: "Servidor Desconectado",
          description: "Verifique se o servidor está rodando em localhost:3001",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, [status]); // Add status as dependency to properly handle status changes

  return { status, checkServerStatus };
};