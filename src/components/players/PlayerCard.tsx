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
    systemLogger.log('player', `Card do jogador #${player.id} renderizado`, {
      score: player.score,
      hasPredictions: player.predictions?.length > 0,
      predictions: player.predictions,
      weights: player.weights?.length,
      timestamp: new Date().toISOString()
    });
  }, [player]);

  const formatNumbers = (numbers: number[]): string => {
    if (!numbers || numbers.length === 0) {
      return 'Aguardando predições...';
    }
    return numbers.map(n => n.toString().padStart(2, '0')).join(', ');
  };

  const getLastMatchHistory = () => {
    if (!player.matchHistory || player.matchHistory.length === 0) {
      return {
        matches: 0,
        score: 0,
        predictions: [] as number[],
        drawnNumbers: [] as number[]
      };
    }
    return player.matchHistory[player.matchHistory.length - 1];
  };

  const lastMatch = getLastMatchHistory();

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
        <Badge variant={isTopPlayer ? "default" : "secondary"}>
          Score: {player.score}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="bg-muted p-2 rounded">
          <p className="text-sm font-medium">Previsões Atuais:</p>
          <p className="text-sm">{formatNumbers(player.predictions)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Acertos Atual</p>
            <p className="text-lg font-bold">{lastMatch.matches}</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Pontos Último Jogo</p>
            <p className="text-lg font-bold">{lastMatch.score}</p>
          </div>
        </div>

        {lastMatch.drawnNumbers.length > 0 && (
          <div className="mt-2 p-2 bg-muted rounded">
            <p className="text-xs font-medium mb-1">Números Sorteados:</p>
            <p className="text-sm">{formatNumbers(lastMatch.drawnNumbers)}</p>
          </div>
        )}

        <Button 
          onClick={(e) => {
            e.stopPropagation();
            systemLogger.log('player', `Clonando jogador #${player.id}`, {
              timestamp: new Date().toISOString()
            });
            onClonePlayer(player, e);
          }}
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