import React from 'react';
import { useServerStatus } from '@/hooks/useServerStatus';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = () => {
  const { status } = useServerStatus();

  return (
    <Alert
      variant={status === 'online' ? 'default' : 'destructive'}
      className={`mb-4 ${
        status === 'checking' ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {status === 'online' ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription>
          Status do Servidor: {' '}
          {status === 'online' && 'Conectado'}
          {status === 'offline' && 'Desconectado'}
          {status === 'checking' && 'Verificando...'}
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default ConnectionStatus;