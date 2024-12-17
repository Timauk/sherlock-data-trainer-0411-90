import React from 'react';
import { Card } from "../../ui/card";
import { Progress } from "../../ui/progress";

interface GameStatusProps {
  progress: number;
  generation: number;
  gameCount: number;
  totalPlayers: number;
  bestScore: number;
}

export const GameStatus = ({ 
  progress, 
  generation, 
  gameCount,
  totalPlayers,
  bestScore 
}: GameStatusProps) => {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Status do Jogo</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span>Progresso da Geração</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <span className="text-sm text-muted-foreground">Geração</span>
            <p className="text-2xl font-bold">{generation}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total de Jogos</span>
            <p className="text-2xl font-bold">{gameCount}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Jogadores</span>
            <p className="text-2xl font-bold">{totalPlayers}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Melhor Pontuação</span>
            <p className="text-2xl font-bold">{bestScore}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};