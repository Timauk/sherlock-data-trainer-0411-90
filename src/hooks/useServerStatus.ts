import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        if (status !== 'offline') {
          setStatus('offline');
        }
      }, 5000); // Increased timeout to 5 seconds

      const response = await fetch('http://localhost:3001/test', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (status !== 'online') {
          setStatus('online');
        }
      } else {
        if (status !== 'offline') {
          setStatus('offline');
        }
      }
    } catch (error) {
      // Only update status if it's not already offline
      if (status !== 'offline') {
        setStatus('offline');
      }

      // Avoid showing error toast for AbortError
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Server status check error:', error);
      }
    }
  };

  useEffect(() => {
    checkServerStatus();
    
    // Check every 10 seconds instead of 3
    const interval = setInterval(checkServerStatus, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []); 

  return { status };
};