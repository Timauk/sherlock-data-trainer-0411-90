import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';
import { Weight } from './types';
import { useToast } from "@/components/ui/use-toast";

interface PlayerWeightsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  editedWeights: Weight[];
  onWeightChange: (index: number, value: number) => void;
  onClonePlayer: (player: Player) => void;
}

const PlayerWeightsDialog: React.FC<PlayerWeightsDialogProps> = ({
  isOpen,
  onOpenChange,
  player,
  editedWeights,
  onWeightChange,
  onClonePlayer,
}) => {
  const { toast } = useToast();

  if (!player) return null;

  const handleWeightChange = (index: number, value: number) => {
    onWeightChange(index, value);
    toast({
      title: "Peso Ajustado",
      description: `${editedWeights[index].name}: ${value}`,
    });
  };

  const handleClonePlayer = () => {
    onClonePlayer(player);
    toast({
      title: "Jogador Clonado",
      description: `Clone do Jogador #${player.id} criado com sucesso!`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar Pesos do Jogador #{player.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {editedWeights.map((weight, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  {weight.name}
                  <span className="ml-2 text-muted-foreground">({weight.value})</span>
                </label>
                <span className="text-xs text-muted-foreground">{weight.description}</span>
              </div>
              <Slider
                value={[weight.value]}
                min={0}
                max={1000}
                step={1}
                onValueChange={(value) => handleWeightChange(index, value[0])}
              />
            </div>
          ))}
          <Button
            onClick={handleClonePlayer}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Copy className="mr-2 h-4 w-4" />
            Clonar Jogador
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerWeightsDialog;
