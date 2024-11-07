import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Lock } from 'lucide-react';
import { Player } from '@/types/gameTypes';

interface PlayerCardProps {
  player: Player;
  isTopPlayer: boolean;
  onPlayerClick: (player: Player) => void;
  onClonePlayer: (player: Player, e: React.MouseEvent) => void;
  canClone: boolean;
}

const getNicheColor = (niche: number) => {
  switch (niche) {
    case 0: return 'bg-blue-100 dark:bg-blue-900';
    case 1: return 'bg-green-100 dark:bg-green-900';
    case 2: return 'bg-purple-100 dark:bg-purple-900';
    case 3: return 'bg-orange-100 dark:bg-orange-900';
    default: return 'bg-card';
  }
};

const getNicheName = (niche: number) => {
  switch (niche) {
    case 0: return 'Pares';
    case 1: return 'Ímpares';
    case 2: return 'Sequências';
    case 3: return 'Geral';
    default: return 'Desconhecido';
  }
};

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isTopPlayer,
  onPlayerClick,
  onClonePlayer,
  canClone
}) => {
  const formatPredictions = (predictions: number[]) => {
    return predictions.length > 0 
      ? predictions.map(n => n.toString().padStart(2, '0')).join(', ')
      : 'Aguardando próxima rodada';
  };

  const nicheColor = getNicheColor(player.niche);

  return (
    <div 
      onClick={() => onPlayerClick(player)}
      className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg
        ${isTopPlayer ? 'border-2 border-yellow-500' : ''} ${nicheColor}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg">
          Jogador #{player.id}
          {isTopPlayer && <span className="ml-2 text-yellow-600">👑</span>}
        </h4>
        <Badge variant={isTopPlayer ? "default" : "secondary"}>
          Score: {player.score.toFixed(0)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-medium">Nicho:</span> {getNicheName(player.niche)}
        </p>
        <p className="text-sm">
          <span className="font-medium">Idade:</span> {player.age} gerações
        </p>
        <p className="text-sm">
          <span className="font-medium">Previsões:</span> {formatPredictions(player.predictions)}
        </p>
        <p className="text-sm">
          <span className="font-medium">Acertos:</span> {player.fitness}
        </p>
        <Button 
          onClick={(e) => onClonePlayer(player, e)}
          className={`w-full mt-2 ${canClone ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'}`}
          variant="default"
          disabled={!canClone}
        >
          {canClone ? (
            <Copy className="mr-2 h-4 w-4" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {canClone ? 'Clonar Jogador' : 'Aguarde próximo ciclo'}
        </Button>
      </div>
    </div>
  );
};

export default PlayerCard;