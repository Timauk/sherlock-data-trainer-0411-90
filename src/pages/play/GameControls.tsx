import React, { useState } from 'react';
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { useToast } from "../../hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../../logger';

export const GameControls = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const { toast } = useToast();

  const handleNumberClick = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(prev => prev.filter(n => n !== number));
    } else if (selectedNumbers.length < 15) {
      setSelectedNumbers(prev => [...prev, number].sort((a, b) => a - b));
    }
  };

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

  const loadModel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const modelFile = Array.from(files).find(file => file.name.endsWith('.json'));
        const weightsFile = Array.from(files).find(file => file.name.endsWith('.bin'));
        
        if (!modelFile || !weightsFile) {
          throw new Error('Necessário arquivos .json e .bin do modelo');
        }

        const loadedModel = await tf.loadLayersModel(tf.io.browserFiles(
          [modelFile, weightsFile]
        ));
        
        setModel(loadedModel);
        toast({
          title: "Modelo Carregado",
          description: "Modelo neural carregado com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar modelo",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      }
    }
  };

  const generateGames = async () => {
    if (!model) {
      toast({
        title: "Modelo não carregado",
        description: "Por favor, carregue o modelo neural primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const games: number[][] = [];
      for (let i = 0; i < 8; i++) {
        // Usando um tensor aleatório diferente para cada jogo
        const inputTensor = tf.randomNormal([1, 13057]);
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const result = Array.from(await prediction.data());
        
        // Convertendo as previsões em números de 1 a 25
        const numbers = result
          .map((n, i) => ({ value: n, index: i + 1 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 15)
          .map(n => n.index)
          .sort((a, b) => a - b);
        
        games.push(numbers);
        
        // Limpando os tensores para evitar vazamento de memória
        inputTensor.dispose();
        prediction.dispose();
      }
      
      setGeneratedGames(games);
      systemLogger.log('game', 'Games generated:', { games });
      
      toast({
        title: "Jogos Gerados",
        description: "8 jogos foram gerados com sucesso!",
      });
    } catch (error) {
      systemLogger.error('game', 'Error generating games:', { error });
      toast({
        title: "Erro ao gerar jogos",
        description: "Ocorreu um erro ao gerar os jogos",
        variant: "destructive",
      });
    }
  };

  const handlePlayClick = () => {
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      toast({
        title: "Jogo Iniciado",
        description: "O jogo está em execução",
      });
      systemLogger.log('game', 'Game started');
    } else {
      toast({
        title: "Jogo Pausado",
        description: "O jogo foi pausado",
      });
      systemLogger.log('game', 'Game paused');
    }
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
              variant={selectedNumbers.includes(number) ? "default" : "secondary"}
            >
              {number}
            </Button>
          ))}
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handlePlayClick}
            className="flex-1"
            variant={isPlaying ? "destructive" : "default"}
          >
            {isPlaying ? "Pausar" : "Iniciar"}
          </Button>
          <Button 
            onClick={() => setSelectedNumbers([])}
            className="flex-1"
            variant="secondary"
          >
            Limpar
          </Button>
          <Button
            onClick={generateGames}
            className="flex-1"
            disabled={!model}
            variant="default"
          >
            Gerar 8 Jogos
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="file"
              id="csvUpload"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => document.getElementById('csvUpload')?.click()}
            >
              Carregar CSV
            </Button>
          </div>
          
          <div>
            <input
              type="file"
              id="modelUpload"
              multiple
              accept=".json,.bin"
              onChange={loadModel}
              className="hidden"
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={() => document.getElementById('modelUpload')?.click()}
            >
              Carregar Modelo
            </Button>
          </div>
        </div>

        {generatedGames.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Jogos Gerados:</h3>
            <div className="space-y-2">
              {generatedGames.map((game, index) => (
                <div key={index} className="flex flex-wrap gap-2 p-2 bg-secondary rounded">
                  <span className="font-bold">Jogo {index + 1}:</span>
                  {game.map((number, i) => (
                    <span key={i} className="px-2 py-1 bg-primary text-primary-foreground rounded">
                      {number}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
};