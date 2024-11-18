import React from 'react';
import GameBoard from '../GameBoard';
import { Player } from '@/types/gameTypes';

interface GameBoardSectionProps {
  players: Player[];
  evolutionData: Array<{
    generation: number;
    playerId: number;
    score: number;
    fitness: number;
  }>;
  boardNumbers: number[];
  concursoNumber: number;
  onUpdatePlayer?: (playerId: number, newWeights: number[]) => void;
}

const GameBoardSection: React.FC<GameBoardSectionProps> = ({
  players,
  evolutionData,
  boardNumbers,
  concursoNumber,
  onUpdatePlayer
}) => {
  return (
    <div className="mt-4">
      <GameBoard
        players={players}
        evolutionData={evolutionData}
        boardNumbers={boardNumbers}
        concursoNumber={concursoNumber}
        onUpdatePlayer={onUpdatePlayer}
      />
    </div>
  );
};

export default GameBoardSection;