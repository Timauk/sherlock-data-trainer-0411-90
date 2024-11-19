import React from 'react';
import BoardDisplay from './BoardDisplay';
import PlayerList from './PlayerList';
import EvolutionChart from './EvolutionChart';
import { Player } from '@/types/gameTypes';

interface GameBoardProps {
  boardNumbers: number[];
  concursoNumber: number;
  totalGames?: number;
  players: Player[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  boardNumbers, 
  concursoNumber,
  totalGames = 0,
  players, 
  evolutionData = [],
  onUpdatePlayer
}) => {
  return (
    <div>
      <BoardDisplay 
        numbers={boardNumbers} 
        concursoNumber={concursoNumber}
        totalGames={totalGames}
      />
      <PlayerList players={players} onUpdatePlayer={onUpdatePlayer} />
      <EvolutionChart data={evolutionData} />
    </div>
  );
};

export default GameBoard;