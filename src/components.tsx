import React from 'react';
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Services } from './services';
import { systemLogger } from './logger';
import { Player, PredictionResult } from './types';
import { useToast } from './toast';

export const DiagnosticReport: React.FC<{ modelMetrics: any }> = ({ modelMetrics }) => {
  return (
    <Card className="p-4">
      <h3>Diagnóstico do Modelo</h3>
      <div>Acurácia: {modelMetrics?.accuracy || 0}%</div>
      <div>Latência: {modelMetrics?.latency || 0}ms</div>
    </Card>
  );
};

export const LongTermMonitoring: React.FC = () => {
  const [metrics, setMetrics] = React.useState({
    accuracy: 0,
    latency: 0,
    memoryUsage: 0,
    predictions: 0
  });

  React.useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = Services.getModelMetrics();
      setMetrics(currentMetrics);
    };

    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4">
      <h3>Monitoramento de Longo Prazo</h3>
      <div>Acurácia Média: {metrics.accuracy}%</div>
      <div>Latência Média: {metrics.latency}ms</div>
      <div>Uso de Memória: {metrics.memoryUsage}MB</div>
      <div>Total de Previsões: {metrics.predictions}</div>
    </Card>
  );
};

export const PlayerList: React.FC<{ players: Player[]; onUpdatePlayer?: (playerId: number, newWeights: number[]) => void; onClonePlayer?: (player: Player) => void; }> = ({ players, onUpdatePlayer, onClonePlayer }) => {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [editedWeights, setEditedWeights] = React.useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const maxScore = Math.max(...players.map(p => p.score));

  React.useEffect(() => {
    if (selectedPlayer) {
      const currentPlayer = players.find(p => p.id === selectedPlayer.id);
      if (currentPlayer) {
        const weights = currentPlayer.weights.map((value, index) => ({
          name: `Peso ${index + 1}`,
          value: Math.round(value)
        }));
        setEditedWeights(weights);
      }
    }
  }, [selectedPlayer, players]);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsDialogOpen(true);
  };

  const handleWeightChange = (index: number, newValue: number) => {
    if (selectedPlayer && onUpdatePlayer) {
      const newWeights = [...selectedPlayer.weights];
      newWeights[index] = newValue;
      onUpdatePlayer(selectedPlayer.id, newWeights);
      const updatedWeights = [...editedWeights];
      updatedWeights[index] = { ...updatedWeights[index], value: newValue };
      setEditedWeights(updatedWeights);
      toast({
        title: "Peso Ajustado",
        description: `${editedWeights[index].name}: ${newValue}`,
      });
    }
  };

  const handleClonePlayer = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onClonePlayer) {
      onClonePlayer(player);
      toast({
        title: "Jogador Clonado",
        description: `Um clone do Jogador #${player.id} foi criado com sucesso.`
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {players.map(player => (
        <Card key={player.id} onClick={() => handlePlayerClick(player)}>
          <h4>Jogador #{player.id}</h4>
          <div>Pontuação: {player.score}</div>
          <div>Predições: {player.predictions.length}</div>
          <Button onClick={(e) => handleClonePlayer(player, e)}>Clonar</Button>
        </Card>
      ))}
      {/* PlayerWeightsDialog component would go here */}
    </div>
  );
};

export const TrainingControls: React.FC<{ batchSize: string; setBatchSize: (value: string) => void; epochs: number; setEpochs: (value: number) => void; }> = ({ batchSize, setBatchSize, epochs, setEpochs }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="epochs">Número de Épocas</label>
        <input
          id="epochs"
          type="number"
          value={epochs}
          onChange={(e) => setEpochs(Number(e.target.value))}
          min={1}
          max={1000}
          className="w-[180px]"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label>Batch Size</label>
        <select value={batchSize} onChange={(e) => setBatchSize(e.target.value)}>
          <option value="32">Batch Size: 32</option>
          <option value="16">Batch Size: 16</option>
          <option value="8">Batch Size: 8</option>
          <option value="4">Batch Size: 4</option>
          <option value="2">Batch Size: 2</option>
        </select>
      </div>
    </div>
  );
};

export const TrainingProgress: React.FC<{ trainingProgress: number }> = ({ trainingProgress }) => {
  return trainingProgress > 0 ? (
    <div className="mt-4">
      <div className="progress" style={{ width: `${trainingProgress}%` }} />
      <p className="text-center mt-2">{trainingProgress}% Concluído</p>
    </div>
  ) : null;
};

export const TrainingActions: React.FC<{ startTraining: () => void; saveModel: () => void; trainingData: any; model: any; handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ startTraining, saveModel, trainingData, model, handleFileUpload }) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label htmlFor="fileInput" className="block mb-2">Carregar dados (CSV):</label>
        <input
          type="file"
          id="fileInput"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500"
        />
      </div>

      <Button onClick={startTraining} disabled={!trainingData} className="w-full">
        Iniciar Treinamento
      </Button>

      <Button onClick={saveModel} disabled={!model} className="w-full">
        Salvar Modelo Base
      </Button>
    </div>
  );
};
