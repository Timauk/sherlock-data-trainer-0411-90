import React from 'react';
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Upload } from 'lucide-react';
import { useGameControls } from '../../hooks';

export const GameControls = () => {
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Implementar lógica de upload
      console.log("Arquivo selecionado:", file.name);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Controles do Jogo</h2>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Button onClick={isPlaying ? pauseGame : playGame} className="flex-1">
            {isPlaying ? "Pausar" : "Iniciar"}
          </Button>
          <Button onClick={resetGame} variant="outline" className="flex-1">
            Reiniciar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <label htmlFor="csvUpload" className="flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={16} />
              Carregar CSV
            </label>
          </Button>
        </div>
      </div>
    </Card>
  );
};