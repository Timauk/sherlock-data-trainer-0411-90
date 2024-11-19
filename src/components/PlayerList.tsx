import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import PlayerCard from './PlayerCard';
import PlayerWeightsDialog from './PlayerWeightsDialog';

export interface Weight {
  name: string;
  value: number;
  description: string;
}

const WEIGHT_DESCRIPTIONS: Weight[] = [
  { name: "Aprendizado Base", value: 0, description: "Capacidade de aprender com dados históricos" },
  { name: "Adaptabilidade", value: 0, description: "Velocidade de adaptação a mudanças" },
  { name: "Memória", value: 0, description: "Capacidade de reter padrões importantes" },
  { name: "Intuição", value: 0, description: "Habilidade de detectar padrões sutis" },
  { name: "Precisão", value: 0, description: "Acurácia nas previsões" },
  { name: "Consistência", value: 0, description: "Estabilidade nas previsões" },
  { name: "Inovação", value: 0, description: "Capacidade de encontrar novos padrões" },
  { name: "Equilíbrio", value: 0, description: "Balanceamento entre exploração e aproveitamento" },
  { name: "Foco", value: 0, description: "Concentração em padrões relevantes" },
  { name: "Resiliência", value: 0, description: "Recuperação após erros" },
  { name: "Otimização", value: 0, description: "Eficiência no uso dos recursos" },
  { name: "Cooperação", value: 0, description: "Capacidade de aprender com outros jogadores" },
  { name: "Especialização", value: 0, description: "Foco em nichos específicos" },
  { name: "Generalização", value: 0, description: "Adaptação a diferentes cenários" },
  { name: "Evolução", value: 0, description: "Taxa de melhoria ao longo do tempo" },
  { name: "Estabilidade", value: 0, description: "Consistência no desempenho" },
  { name: "Criatividade", value: 0, description: "Capacidade de gerar soluções únicas" }
];

interface PlayerListProps {
  players: Player[];
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
  onClonePlayer?: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ 
  players, 
  onUpdatePlayer,
  onClonePlayer 
}) => {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editedWeights, setEditedWeights] = useState<Weight[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const maxScore = Math.max(...players.map(p => p.score));

  useEffect(() => {
    if (selectedPlayer) {
      const currentPlayer = players.find(p => p.id === selectedPlayer.id);
      if (currentPlayer) {
        const weights = currentPlayer.weights.map((value, index) => ({
          ...WEIGHT_DESCRIPTIONS[index],
          value: Math.round(value)
        }));
        setEditedWeights(weights);
      }
    }
  }, [selectedPlayer, players]);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    const weights = player.weights.map((value, index) => ({
      ...WEIGHT_DESCRIPTIONS[index],
      value: Math.round(value)
    }));
    setEditedWeights(weights);
    setIsDialogOpen(true);
  };

  const handleWeightChange = (index: number, newValue: number) => {
    if (selectedPlayer && onUpdatePlayer) {
      const newWeights = [...selectedPlayer.weights];
      newWeights[index] = newValue;
      onUpdatePlayer(selectedPlayer.id, newWeights);
      
      const updatedWeights = [...editedWeights];
      updatedWeights[index] = { ...updatedWeights[index], value: newValue };
      setEditedWeights(updatedWeights);
      toast({
        title: "Peso Ajustado",
        description: `${editedWeights[index].name}: ${newValue}`,
      });
    }
  };

  const handleClonePlayer = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onClonePlayer) {
      onClonePlayer(player);
      toast({
        title: "Jogador Clonado",
        description: `Um clone do Jogador #${player.id} foi criado com sucesso.`
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {players.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          isTopPlayer={player.score === maxScore}
          onPlayerClick={handlePlayerClick}
          onClonePlayer={handleClonePlayer}
        />
      ))}
      
      <PlayerWeightsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        player={selectedPlayer}
        editedWeights={editedWeights}
        onWeightChange={handleWeightChange}
        onClonePlayer={handleClonePlayer}
      />
    </div>
  );
};

export default PlayerList;
