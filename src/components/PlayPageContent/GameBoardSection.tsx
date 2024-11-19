import React from 'react';
import { Player } from '@/types/gameTypes';
import GameBoard from '../GameBoard';
import DataUploader from '../DataUploader';

interface GameBoardSectionProps {
  players: Player[];
  onUpdatePlayer: (playerId: number, newWeights: number[]) => void;
  evolutionData: any;
  boardNumbers: number[];
  concursoNumber: number;
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File, metadataFile?: File, weightSpecsFile?: File) => void;
  onSaveModel: () => void;
}

const GameBoardSection = ({
  players,
  onUpdatePlayer,
  evolutionData,
  boardNumbers,
  concursoNumber,
  onCsvUpload,
  onModelUpload,
  onSaveModel
}: GameBoardSectionProps) => {
  // Ensure we only pass the first 80 players to GameBoard
  const limitedPlayers = players.slice(0, 80);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Preparação</h2>
        <DataUploader 
          onCsvUpload={onCsvUpload}
          onModelUpload={onModelUpload}
          onSaveModel={onSaveModel}
        />
      </div>

      <div className="bg-card rounded-lg p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tabuleiro do Jogo</h2>
        <GameBoard
          players={limitedPlayers}
          evolutionData={evolutionData}
          boardNumbers={boardNumbers}
          concursoNumber={concursoNumber}
          onUpdatePlayer={onUpdatePlayer}
        />
      </div>
    </div>
  );
};

export default GameBoardSection;