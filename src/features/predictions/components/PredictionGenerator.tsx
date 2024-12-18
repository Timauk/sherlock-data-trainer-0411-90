import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface PredictionGeneratorProps {
  onGenerate: () => void;
  isGenerating: boolean;
  isReady: boolean;
}

const PredictionGenerator: React.FC<PredictionGeneratorProps> = ({
  onGenerate,
  isGenerating,
  isReady
}) => {
  return (
    <Button
      onClick={onGenerate}
      disabled={!isReady || isGenerating}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        'Gerar Previsões'
      )}
    </Button>
  );
};

export default PredictionGenerator;