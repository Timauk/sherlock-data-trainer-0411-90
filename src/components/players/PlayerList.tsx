import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Player } from '@/types/gameTypes';
import PlayerCard from './PlayerCard';
import PlayerWeightsDialog from './PlayerWeightsDialog';
import { systemLogger } from '@/utils/logging/systemLogger';

/**
 * Componente que gerencia e exibe a lista de jogadores
 * 
 * Funcionalidades:
 * - Renderiza cards para cada jogador
 * - Gerencia seleção de jogadores
 * - Permite edição de pesos
 * - Monitora campeões
 */
export interface Weight {
  name: string;
  value: number;
  description: string;
}

// Descrições dos pesos para documentação e UI
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
  // Log detalhado dos jogadores recebidos
  useEffect(() => {
    systemLogger.log('player', 'Lista de jogadores atualizada', {
      totalPlayers: players.length,
      playersWithPredictions: players.filter(p => p.predictions?.length > 0).length,
      playersWithoutPredictions: players.filter(p => !p.predictions?.length).length,
      averageScore: players.reduce((acc, p) => acc + p.score, 0) / players.length,
      timestamp: new Date().toISOString()
    });
  }, [players]);

  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editedWeights, setEditedWeights] = useState<Weight[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const maxScore = Math.max(...players.map(p => p.score));

  // Monitora mudanças nos jogadores
  useEffect(() => {
    if (selectedPlayer) {
      const currentPlayer = players.find(p => p.id === selectedPlayer.id);
      if (currentPlayer) {
        systemLogger.log('player', `Atualizando jogador #${currentPlayer.id}`, {
          score: currentPlayer.score,
          hasPredictions: currentPlayer.predictions?.length > 0,
          predictions: currentPlayer.predictions,
          weights: currentPlayer.weights?.length,
          fitness: currentPlayer.fitness
        });

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

    systemLogger.log('player', `Detalhes do Jogador #${player.id}`, {
      score: player.score,
      predictions: player.predictions,
      fitness: player.fitness,
      isTopPlayer: player.score === maxScore
    });
  };

  const handleWeightChange = (index: number, newValue: number) => {
    if (selectedPlayer && onUpdatePlayer) {
      const newWeights = [...selectedPlayer.weights];
      newWeights[index] = newValue;
      
      systemLogger.log('weights', `Atualizando peso do jogador #${selectedPlayer.id}`, {
        weightIndex: index,
        oldValue: selectedPlayer.weights[index],
        newValue: newValue
      });

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
      systemLogger.log('clone', `Clonando jogador #${player.id}`, {
        originalScore: player.score,
        predictions: player.predictions,
        weights: player.weights?.length
      });

      onClonePlayer(player);
      toast({
        title: "Jogador Clonado",
        description: `Um clone do Jogador #${player.id} foi criado com sucesso.`
      });
    }
  };

  // Renderiza a lista de jogadores com validação
  if (!players || players.length === 0) {
    systemLogger.warn('player', 'Nenhum jogador disponível para exibição');
    return (
      <div className="p-4 text-center text-gray-500">
        Nenhum jogador disponível no momento.
      </div>
    );
  }

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