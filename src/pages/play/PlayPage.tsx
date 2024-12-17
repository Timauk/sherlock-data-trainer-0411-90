import React from 'react';
import { GameControls } from './GameControls';
import { GameStatus } from './GameStatus';
import { DiagnosticReport, LongTermMonitoring, PlayerList } from '../../components';
import { useGameState, useGamePlayers } from '../../hooks';
import { Card } from "../../ui/card";

export const PlayPage = () => {
  const { gameCount, modelMetrics, isInfiniteMode, setIsInfiniteMode } = useGameState();
  const { players, initializePlayers } = useGamePlayers();

  React.useEffect(() => {
    initializePlayers(6);
  }, [initializePlayers]);

  const bestScore = React.useMemo(() => {
    return players.reduce((max, player) => Math.max(max, player.score), 0);
  }, [players]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold mb-8 neon-title">Sherlock Data Trainer</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GameControls />
          <GameStatus 
            progress={75} 
            generation={1} 
            gameCount={gameCount}
            totalPlayers={players.length}
            bestScore={bestScore}
          />
          <PlayerList 
            players={players}
            onUpdatePlayer={(id, weights) => console.log("Update player", id, weights)}
            onClonePlayer={(player) => console.log("Clone player", player)}
          />
        </div>
        
        <div className="space-y-6">
          <Card className="p-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isInfiniteMode}
                onChange={(e) => setIsInfiniteMode(e.target.checked)}
                className="form-checkbox"
              />
              <span>Modo Infinito</span>
            </label>
          </Card>
          <DiagnosticReport modelMetrics={modelMetrics} />
          <LongTermMonitoring />
        </div>
      </div>
    </div>
  );
};