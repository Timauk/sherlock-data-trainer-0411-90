import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      // Get the current hostname and use it to build the API URL
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/status'
        : `/api/status`; // Use relative path for deployed environment

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
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
          description: "Verifique se o servidor está rodando corretamente",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, checkServerStatus };
};