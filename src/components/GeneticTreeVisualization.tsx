import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Player } from '@/types/gameTypes';

interface GeneticTreeVisualizationProps {
  players: Player[];
  generation: number;
}

const GeneticTreeVisualization: React.FC<GeneticTreeVisualizationProps> = ({ players, generation }) => {
  if (!players || players.length === 0) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle>Evolução do Campeão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aguardando dados de evolução...</p>
        </CardContent>
      </Card>
    );
  }

  const champion = players.reduce((prev, current) => 
    (current.fitness > prev.fitness) ? current : prev, players[0]);

  const evolutionData = [{
    generation: generation - 1,
    score: champion.score - champion.fitness,
    fitness: champion.fitness - 1
  }, {
    generation,
    score: champion.score,
    fitness: champion.fitness
  }];

  const improved = champion.fitness > (champion.fitness - 1);

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Evolução do Campeão</span>
          {improved && <span className="text-green-500">↑ Melhorou</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="generation" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#8884d8" name="Pontuação" />
              <Line type="monotone" dataKey="fitness" stroke="#82ca9d" name="Fitness" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneticTreeVisualization;