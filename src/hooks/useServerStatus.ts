import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { connectionLogger } from '@/utils/logging/connectionLogger';

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':5173', ':3001');
      
      connectionLogger.logWebSocketAttempt(apiUrl);
      
      const response = await fetch(`${apiUrl}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        if (status !== 'online') {
          setStatus('online');
          connectionLogger.logWebSocketSuccess(apiUrl);
        }
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      if (status !== 'offline') {
        setStatus('offline');
        connectionLogger.logWebSocketError(window.location.origin, error);
        
        toast({
          title: "Server Offline",
          description: "Could not connect to server",
          variant: "destructive"
        });
      }
    }
  };

  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, [status]);

  return { status };
};