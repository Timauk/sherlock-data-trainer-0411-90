import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://localhost:3001/test', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.message === 'Server is running') {
          if (status !== 'online') {
            setStatus('online');
            toast({
              title: "Servidor Conectado",
              description: "Conexão estabelecida com sucesso.",
            });
          }
        } else {
          throw new Error('Resposta inesperada do servidor');
        }
      } else {
        throw new Error('Resposta do servidor não ok');
      }
    } catch (error) {
      if (status !== 'offline') {
        setStatus('offline');
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
  }, [status]); // Add status as dependency to prevent unnecessary toasts

  return { status, checkServerStatus };
};