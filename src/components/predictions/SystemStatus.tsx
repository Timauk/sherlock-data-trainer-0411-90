import React from 'react';
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { SystemStatus as SystemStatusType } from './types';

interface SystemStatusProps {
  missingItems: string[];
  systemReady: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ missingItems, systemReady }): JSX.Element => {
  if (!systemReady || missingItems.length > 0) {
    return (
      <div>
        <AlertCircle className="h-4 w-4" />
        <span>{`Aguardando: ${missingItems.join(', ')}`}</span>
      </div>
    );
  }
  return (
    <div>
      <CheckCircle2 className="h-4 w-4" />
      <span>Sistema Pronto para Gerar!</span>
    </div>
  );
};