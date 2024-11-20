import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useServerStatus = () => {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout to 2 seconds

      const response = await fetch('http://localhost:3001/test', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Prevent caching
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (status !== 'online') {
          setStatus('online');
        }
      } else {
        throw new Error('Server response not ok');
      }
    } catch (error) {
      if (status !== 'offline') {
        setStatus('offline');
      }
    }
  };

  useEffect(() => {
    const checkAndNotify = async () => {
      await checkServerStatus();
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, []); // Remove status dependency to prevent loops

  return { status };
};