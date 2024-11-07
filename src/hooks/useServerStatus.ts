import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'online') {
          setStatus('online');
          if (status === 'offline') {
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
        toast({
          title: "Servidor Desconectado",
          description: "Verifique se o servidor está rodando em localhost:3001",
          variant: "destructive",
        });
      }
      console.error('Server connection error:', error);
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, [status]); // Added status as dependency to properly handle toast notifications

  return { status, checkServerStatus };
};