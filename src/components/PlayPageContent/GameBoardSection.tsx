import React from 'react';
import { Player } from '@/types/gameTypes';
import GameBoard from '../GameBoard';

interface GameBoardSectionProps {
  players: Player[];
  onUpdatePlayer: (playerId: number, newWeights: number[]) => void;
  evolutionData: any;
  boardNumbers: number[];
  concursoNumber: number;
}

const GameBoardSection = ({
  players,
  onUpdatePlayer,
  evolutionData,
  boardNumbers,
  concursoNumber
}: GameBoardSectionProps) => {
  return (
    <div className="space-y-4">
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