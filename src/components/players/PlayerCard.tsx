// Move existing PlayerCard.tsx content here
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
    systemLogger.log('player', `Atualizando estado do Jogador #${player.id}`, {
      id: player.id,
      score: player.score,
      fitness: player.fitness,
      predictions: player.predictions,
      matchHistory: player.matchHistory,
      generation: player.generation,
      timestamp: new Date().toISOString()
    });
  }, [player]);

  const formatPredictions = (predictions: number[]): string => {
    if (!predictions || predictions.length === 0) {
      return 'Aguardando próxima rodada';
    }
    return predictions
      .map(pred => Math.max(1, Math.min(25, Math.round(pred))))
      .sort((a, b) => a - b)
      .join(', ');
  };

  const getRewardClass = (fitness: number): string => {
    if (fitness >= 11) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    if (fitness === 10) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    if (fitness >= 7) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  const getScoreText = (fitness: number): string => {
    const scoreMap: { [key: number]: number } = {
      7: -16,
      8: -8,
      9: -4,
      10: -2,
      11: 2,
      12: 4,
      13: 8,
      14: 16,
      15: 32
    };
    return `${fitness} acertos (${scoreMap[fitness] || 0} pontos)`;
  };

  const getLastMatchHistory = () => {
    if (!player.matchHistory || !Array.isArray(player.matchHistory) || player.matchHistory.length === 0) {
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
        <div className="flex flex-col items-end gap-1">
          <Badge variant={isTopPlayer ? "default" : "secondary"}>
            Score Total: {player.score.toFixed(0)}
          </Badge>
          <Badge variant="outline" className={getRewardClass(player.fitness)}>
            {getScoreText(player.fitness)}
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
            <p className="text-xs font-medium">Acertos Atual</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold">{lastMatch.matches}</p>
              <p className="text-xs text-muted-foreground">de 15</p>
            </div>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Pontos Último Jogo</p>
            <p className="text-lg font-bold">{lastMatch.score}</p>
          </div>
        </div>

        {lastMatch.matches > 0 && (
          <div className="mt-2 p-2 bg-muted rounded">
            <p className="text-xs font-medium mb-1">Números Sorteados:</p>
            <p className="text-sm">{lastMatch.drawnNumbers.sort((a, b) => a - b).join(', ')}</p>
            <p className="text-xs font-medium mt-2 mb-1">Suas Previsões:</p>
            <p className="text-sm">{lastMatch.predictions.sort((a, b) => a - b).join(', ')}</p>
          </div>
        )}

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
