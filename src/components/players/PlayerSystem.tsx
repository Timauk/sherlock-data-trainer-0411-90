import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy } from 'lucide-react';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { PLAYER_BASE_WEIGHTS } from '@/utils/constants';

export const PlayerSystem = ({ players, onPlayerClick, onClonePlayer }: {
  players: Player[];
  onPlayerClick: (player: Player) => void;
  onClonePlayer: (player: Player, e: React.MouseEvent) => void;
}) => {
  useEffect(() => {
    systemLogger.log('players', 'Sistema de jogadores inicializado', {
      totalPlayers: players.length,
      averageScore: players.reduce((acc, p) => acc + p.score, 0) / players.length,
      highestScore: Math.max(...players.map(p => p.score)),
      lowestScore: Math.min(...players.map(p => p.score)),
      timestamp: new Date().toISOString()
    });
  }, [players]);

  const maxScore = Math.max(...players.map(p => p.score));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {players.map(player => (
        <PlayerCard
          key={player.id}
          player={player}
          isTopPlayer={player.score === maxScore}
          onPlayerClick={onPlayerClick}
          onClonePlayer={onClonePlayer}
        />
      ))}
    </div>
  );
};

const PlayerCard = ({ 
  player, 
  isTopPlayer, 
  onPlayerClick, 
  onClonePlayer 
}: {
  player: Player;
  isTopPlayer: boolean;
  onPlayerClick: (player: Player) => void;
  onClonePlayer: (player: Player, e: React.MouseEvent) => void;
}) => {
  useEffect(() => {
    systemLogger.log('player', `Card do jogador #${player.id} renderizado`, {
      predictions: player.predictions?.length || 0,
      weights: player.weights?.length || 0,
      score: player.score,
      isTopPlayer,
      fitness: player.fitness,
      generation: player.generation,
      timestamp: new Date().toISOString()
    });
  }, [player, isTopPlayer]);

  const formatNumbers = (numbers: number[]): string => {
    if (!numbers || numbers.length === 0) {
      systemLogger.warn('player', `Jogador #${player.id} sem predições`, {
        timestamp: new Date().toISOString()
      });
      return 'Aguardando predições...';
    }
    return numbers.map(n => n.toString().padStart(2, '0')).join(', ');
  };

  return (
    <Card 
      onClick={() => {
        systemLogger.log('player', `Card do jogador #${player.id} clicado`, {
          timestamp: new Date().toISOString()
        });
        onPlayerClick(player);
      }}
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
          <p className="text-sm font-medium">Predições Atuais:</p>
          <p className="text-sm">{formatNumbers(player.predictions)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Pesos Base</p>
            <p className="text-lg font-bold">{Object.keys(PLAYER_BASE_WEIGHTS).length}</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-xs font-medium">Geração</p>
            <p className="text-lg font-bold">{player.generation}</p>
          </div>
        </div>

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

export default PlayerSystem;