import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Server, Globe } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProcessingSelectorProps {
  isServerProcessing: boolean;
  onToggleProcessing: () => void;
  serverStatus: 'online' | 'offline' | 'checking';
}

const ProcessingSelector: React.FC<ProcessingSelectorProps> = ({
  isServerProcessing,
  onToggleProcessing,
  serverStatus
}) => {
  const { toast } = useToast();

  const handleToggle = () => {
    if (serverStatus === 'offline' && !isServerProcessing) {
      toast({
        title: "Servidor Indisponível",
        description: "O servidor Node.js não está respondendo. Verifique se ele está rodando em localhost:3001",
        variant: "destructive"
      });
      return;
    }
    onToggleProcessing();
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-background rounded-lg border">
      <h3 className="text-lg font-semibold mb-2">Modo de Processamento</h3>
      
      {serverStatus === 'offline' && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>
            Servidor Node.js está offline. Verifique se o servidor está rodando em localhost:3001
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleToggle}
          variant={isServerProcessing ? "default" : "outline"}
          className={`flex-1 ${serverStatus === 'offline' ? 'opacity-50' : ''}`}
          disabled={serverStatus === 'checking'}
        >
          <Server className="mr-2 h-4 w-4" />
          Servidor Node.js
          {serverStatus === 'checking' && " (Verificando...)"}
          {serverStatus === 'offline' && " (Offline)"}
        </Button>
        <Button
          onClick={handleToggle}
          variant={!isServerProcessing ? "default" : "outline"}
          className="flex-1"
          disabled={serverStatus === 'checking'}
        >
          <Globe className="mr-2 h-4 w-4" />
          Navegador
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {isServerProcessing 
          ? "Processamento será realizado no servidor Node.js" 
          : "Processamento será realizado localmente no navegador"}
      </p>
    </div>
  );
};

export default ProcessingSelector;