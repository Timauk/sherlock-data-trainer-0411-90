import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SystemStatus } from './types';

interface PredictionsHeaderProps {
  status: SystemStatus;
  isGenerating: boolean;
  onGenerate: () => void;
  isServerProcessing?: boolean;
}

export const PredictionsHeader: React.FC<PredictionsHeaderProps> = ({
  status,
  isGenerating,
  onGenerate,
  isServerProcessing = false
}) => {
  return (
    <div className="flex justify-between items-center">
      <span>Previsões do Campeão {isServerProcessing ? '(Servidor)' : '(Local)'}</span>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white ${status.color}`}>
          {status.icon}
          <span>{status.text}</span>
        </div>
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating || !status.ready}
          className="relative"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar 8 Jogos'
          )}
        </Button>
      </div>
    </div>
  );
};