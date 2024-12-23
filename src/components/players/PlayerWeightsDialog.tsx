import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';
import { Weight } from './types';
import { useToast } from "@/hooks/use-toast";
import { systemLogger } from '@/utils/logging/systemLogger';

const PLAYER_WEIGHTS = [
  { name: "Aprendizado Base", description: "Capacidade de aprender com dados históricos" },
  { name: "Adaptabilidade", description: "Velocidade de adaptação a mudanças" },
  { name: "Memória", description: "Capacidade de reter padrões importantes" },
  { name: "Intuição", description: "Habilidade de detectar padrões sutis" },
  { name: "Precisão", description: "Acurácia nas previsões" },
  { name: "Consistência", description: "Estabilidade nas previsões" },
  { name: "Inovação", description: "Capacidade de encontrar novos padrões" },
  { name: "Equilíbrio", description: "Balanceamento entre exploração e aproveitamento" },
  { name: "Foco", description: "Concentração em padrões relevantes" },
  { name: "Resiliência", description: "Recuperação após erros" },
  { name: "Otimização", description: "Eficiência no uso dos recursos" },
  { name: "Cooperação", description: "Capacidade de aprender com outros jogadores" },
  { name: "Especialização", description: "Foco em nichos específicos" },
  { name: "Generalização", description: "Adaptação a diferentes cenários" },
  { name: "Evolução", description: "Taxa de melhoria ao longo do tempo" },
  { name: "Estabilidade", description: "Consistência no desempenho" },
  { name: "Criatividade", description: "Capacidade de gerar soluções únicas" }
];

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
    systemLogger.log('weights', `Alterando peso do jogador #${player.id}`, {
      weightName: PLAYER_WEIGHTS[index].name,
      oldValue: editedWeights[index].value,
      newValue: value,
      timestamp: new Date().toISOString()
    });
    
    onWeightChange(index, value);
    toast({
      title: "Peso Ajustado",
      description: `${PLAYER_WEIGHTS[index].name}: ${value}`,
    });
  };

  const handleClonePlayer = () => {
    systemLogger.log('clone', `Iniciando clonagem do jogador #${player.id}`, {
      weights: editedWeights,
      timestamp: new Date().toISOString()
    });
    
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
          {PLAYER_WEIGHTS.map((weight, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">
                  {weight.name}
                  <span className="ml-2 text-muted-foreground">({editedWeights[index]?.value || 0})</span>
                </label>
                <span className="text-xs text-muted-foreground">{weight.description}</span>
              </div>
              <Slider
                value={[editedWeights[index]?.value || 0]}
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