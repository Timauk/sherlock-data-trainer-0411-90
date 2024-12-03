import React from 'react';
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SystemStatusProps {
  missingItems: string[];
  systemReady: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ missingItems, systemReady }) => {
  if (!systemReady || missingItems.length > 0) {
    return {
      color: 'bg-yellow-500',
      text: `Aguardando: ${missingItems.join(', ')}`,
      icon: <AlertCircle className="h-4 w-4" />,
      ready: false,
    };
  }
  return {
    color: 'bg-green-500',
    text: 'Sistema Pronto para Gerar!',
    icon: <CheckCircle2 className="h-4 w-4" />,
    ready: true,
  };
};