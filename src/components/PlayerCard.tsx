import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';

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
  useEffect(() => {
    if (player.predictions.length > 0) {
      systemLogger.log('player', `Atualizando estado do Jogador #${player.id}`, {
        predictions: player.predictions,
        fitness: player.fitness,
        score: player.score
      });
    }
  }, [player.predictions, player.fitness, player.score, player.id]);

  const formatPredictions = (predictions: number[]): string => {
    if (!predictions || predictions.length === 0) {
      return 'Aguardando próxima rodada';
    }

    const validNumbers = predictions
      .map(pred => Math.max(1, Math.min(25, Math.round(pred))))
      .sort((a, b) => a - b)
      .map(num => num.toString());

    return validNumbers.join(', ');
  };

  return (
    <Card 
      onClick={() => onPlayerClick(player)}
      className={`p-4 rounded-lg shadow cursor-pointer transition-all hover:shadow-lg
        ${isTopPlayer ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500' : 'bg-card'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-lg">
          Jogador #{player.id}
          {isTopPlayer && <span className="ml-2 text-yellow-600">👑</span>}
        </h4>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={isTopPlayer ? "default" : "secondary"}>
            Score: {player.score.toFixed(0)}
          </Badge>
          <Badge variant="outline">
            Fitness: {player.fitness.toFixed(2)}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium mb-1">Previsões Atuais:</p>
          <p className="text-sm bg-muted p-2 rounded">
            {formatPredictions(player.predictions)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Acertos</p>
            <p className="text-lg font-bold">{player.fitness}</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Geração</p>
            <p className="text-lg font-bold">{player.generation}</p>
          </div>
        </div>

        <Button 
          onClick={(e) => onClonePlayer(player, e)}
          className="w-full mt-2"
          variant="default"
        >
          <Copy className="mr-2 h-4 w-4" />
          Clonar Jogador
        </Button>
      </div>
    </Card>
  );
};

export default PlayerCard;