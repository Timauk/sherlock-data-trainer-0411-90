import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';

interface PlayerCardProps {
  player: Player;
  isTopPlayer: boolean;
  onPlayerClick: (player: Player) => void;
  onClonePlayer: (player: Player, e: React.MouseEvent) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isTopPlayer,
  onPlayerClick,
  onClonePlayer,
}) => {
  const formatPredictions = (predictions: number[]) => {
    return predictions.length > 0 
      ? predictions.map(n => n.toString().padStart(2, '0')).join(', ')
      : 'Aguardando próxima rodada';
  };

  return (
    <div 
      onClick={() => onPlayerClick(player)}
      className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg
        ${isTopPlayer ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500' : 'bg-card'}`}
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
          <span className="font-medium">Previsões:</span> {formatPredictions(player.predictions)}
        </p>
        <p className="text-sm">
          <span className="font-medium">Acertos:</span> {player.fitness}
        </p>
        <p className="text-sm">
          <span className="font-medium">Fitness:</span> {player.fitness.toFixed(2)}
        </p>
        <Button 
          onClick={(e) => onClonePlayer(player, e)}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
          variant="default"
        >
          <Copy className="mr-2 h-4 w-4" />
          Clonar Jogador
        </Button>
      </div>
    </div>
  );
};

export default PlayerCard;