import React, { useState } from 'react';
import { Button } from "../../ui/button";
import { Upload } from 'lucide-react';
import { useGameControls } from '../../hooks';
import { useToast } from "../../hooks/use-toast";
import { Card } from "../../ui/card";

export const GameControls = () => {
  const { isPlaying, playGame, pauseGame, resetGame } = useGameControls();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const numbers = text.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        setSelectedNumbers(numbers);
        toast({
          title: "CSV Carregado",
          description: `${numbers.length} números carregados com sucesso!`,
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar CSV",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNumberClick = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < 15) {
      setSelectedNumbers(prev => [...prev, number]);
    }
  };

  const handleAutoSelect = () => {
    const numbers = Array.from({ length: 15 }, () => 
      Math.floor(Math.random() * 25) + 1
    );
    setSelectedNumbers(numbers);
    setIsAutoMode(true);
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Controles do Jogo</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => i + 1).map(number => (
            <Button
              key={number}
              onClick={() => handleNumberClick(number)}
              className={`${
                selectedNumbers.includes(number) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {number}
            </Button>
          ))}
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={isPlaying ? pauseGame : playGame}
            className="flex-1"
          >
            {isPlaying ? "Pausar" : "Iniciar"}
          </Button>
          <Button 
            onClick={resetGame}
            className="flex-1"
          >
            Reiniciar
          </Button>
          <Button
            onClick={handleAutoSelect}
            className="flex-1"
          >
            Auto
          </Button>
        </div>

        <div className="mb-4">
          <input
            type="file"
            id="csvUpload"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            className="w-full"
            onClick={() => document.getElementById('csvUpload')?.click()}
          >
            <span className="flex items-center justify-center gap-2">
              <Upload size={16} />
              Carregar CSV
            </span>
          </Button>
        </div>

        <div className="p-4 bg-secondary rounded-lg">
          <h3 className="font-semibold mb-2">Números Selecionados:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedNumbers.map(number => (
              <span key={number} className="px-2 py-1 bg-primary text-primary-foreground rounded">
                {number}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};