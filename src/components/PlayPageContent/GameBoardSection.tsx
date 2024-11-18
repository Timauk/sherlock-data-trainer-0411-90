import React from 'react';
import { Player } from '@/types/gameTypes';

interface GameBoardSectionProps {
  players: Player[];
  onUpdatePlayer: (playerId: number) => void;
  evolutionData: any; // replace with the actual type
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="playerSelect" className="block text-sm font-medium mb-1">
            Selecionar Jogador
            <select
              id="playerSelect"
              onChange={(e) => onUpdatePlayer(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  Jogador #{player.id} (Score: {player.score})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      
      {/* Additional content can go here like displaying board numbers or evolution data */}
      <div>
        <h3 className="text-lg font-semibold">Números do Concurso: {concursoNumber}</h3>
        <p className="text-sm">Números do tabuleiro: {boardNumbers.join(', ')}</p>
      </div>

      {/* You can map over evolutionData to show more details */}
    </div>
  );
};

export default GameBoardSection;
