import React, { useState, useCallback } from 'react';
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Upload, Play, Pause, RefreshCw, Wand2 } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import * as tf from '@tensorflow/tfjs';
import { Services } from '../../services';

export const GameControls = () => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const { toast } = useToast();
  const [model, setModel] = useState<tf.LayersModel | null>(null);

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
    const file = event.target.files?.[0];
    if (file) {
      try {
        const modelJson = await file.text();
        const loadedModel = await tf.loadLayersModel(tf.io.browserFiles([file]));
        setModel(loadedModel);
        toast({
          title: "Modelo Carregado",
          description: "Modelo neural carregado com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar modelo",
          description: "Não foi possível carregar o modelo neural.",
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

  const handleAutoSelect = async () => {
    if (!model) {
      toast({
        title: "Modelo não carregado",
        description: "Por favor, carregue o modelo neural primeiro.",
        variant: "destructive",
      });
      return;
    }

    try {
      const prediction = await model.predict(tf.zeros([1, 13057])) as tf.Tensor;
      const numbers = Array.from(await prediction.data())
        .map((n, i) => ({ value: n, index: i + 1 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15)
        .map(n => n.index);
      
      setSelectedNumbers(numbers);
      prediction.dispose();

      toast({
        title: "Números Gerados",
        description: "Números gerados pela rede neural!",
      });
    } catch (error) {
      toast({
        title: "Erro na predição",
        description: "Erro ao gerar números com a rede neural.",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Jogo Pausado" : "Jogo Iniciado",
      description: isPlaying ? "O jogo foi pausado" : "O jogo está em execução",
    });
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
            onClick={handlePlayPause}
            className="flex-1"
          >
            {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
            {isPlaying ? "Pausar" : "Iniciar"}
          </Button>
          <Button 
            onClick={() => setSelectedNumbers([])}
            className="flex-1"
          >
            <RefreshCw className="mr-2" />
            Reiniciar
          </Button>
          <Button
            onClick={handleAutoSelect}
            className="flex-1"
            disabled={!model}
          >
            <Wand2 className="mr-2" />
            Neural
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
              onClick={() => document.getElementById('csvUpload')?.click()}
            >
              <Upload className="mr-2" />
              Carregar CSV
            </Button>
          </div>
          
          <div>
            <input
              type="file"
              id="modelUpload"
              accept=".json,.bin"
              onChange={loadModel}
              className="hidden"
            />
            <Button
              className="w-full"
              onClick={() => document.getElementById('modelUpload')?.click()}
            >
              <Upload className="mr-2" />
              Carregar Modelo
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Números Selecionados:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedNumbers.map(number => (
              <span key={number} className="px-2 py-1 bg-primary text-primary-foreground rounded">
                {number}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </Card>
  );
};