import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GeneticEvolutionChartProps {
  evolutionData: Array<{
    generation: number;
    nicheData: {
      [key: string]: {
        avgFitness: number;
        population: number;
      };
    };
  }>;
}

const NICHE_COLORS = {
  'Pares': '#3B82F6',
  'Ímpares': '#10B981',
  'Sequências': '#8B5CF6',
  'Geral': '#F97316'
};

const GeneticEvolutionChart: React.FC<GeneticEvolutionChartProps> = ({ evolutionData }) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Histórico de Evolução Genética por Nicho</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="generation" 
                label={{ value: 'Geração', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                label={{ value: 'Fitness Médio', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              {Object.entries(NICHE_COLORS).map(([niche, color]) => (
                <Line
                  key={niche}
                  type="monotone"
                  dataKey={`nicheData.${niche}.avgFitness`}
                  name={`${niche}`}
                  stroke={color}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneticEvolutionChart;