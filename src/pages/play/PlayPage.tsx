import React from 'react';
import { GameControls } from './GameControls';
import { GameStatus } from './GameStatus';
import { DiagnosticReport, LongTermMonitoring, PlayerList } from '../../components';
import { useGameState, useGamePlayers } from '../../hooks';

export const PlayPage = () => {
  const { gameCount, modelMetrics } = useGameState();
  const { players, initializePlayers } = useGamePlayers();

  React.useEffect(() => {
    initializePlayers(100);
  }, [initializePlayers]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold mb-8">Jogar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GameControls />
          <GameStatus 
            progress={75} 
            generation={1} 
            gameCount={gameCount} 
          />
          <PlayerList 
            players={players}
            onUpdatePlayer={(id, weights) => console.log("Update player", id, weights)}
            onClonePlayer={(player) => console.log("Clone player", player)}
          />
        </div>
        
        <div className="space-y-6">
          <DiagnosticReport modelMetrics={modelMetrics} />
          <LongTermMonitoring />
        </div>
      </div>
    </div>
  );
};