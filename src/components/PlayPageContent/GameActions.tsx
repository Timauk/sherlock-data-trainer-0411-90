import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GameActionsProps {
  onSaveFullModel: () => Promise<void>;
  onLoadFullModel: () => Promise<void>;
  isProcessing: boolean;
}

const GameActions: React.FC<GameActionsProps> = ({
  onSaveFullModel,
  onLoadFullModel,
  isProcessing
}) => {
  return (
    <div className="space-y-4">
      <Button
        onClick={onSaveFullModel}
        className="w-full"
        variant="secondary"
        disabled={isProcessing}
      >
        Salvar Modelo Completo
      </Button>

      <Button
        onClick={onLoadFullModel}
        className="w-full"
        variant="outline"
        disabled={isProcessing}
      >
        Carregar Modelo Treinado
      </Button>
    </div>
  );
};

export default GameActions;