import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionChartProps {
  data: Array<{
    generation: number;
    score: number;
    fitness: number;
  }>;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ data = [] }) => {
  // Filtra apenas os dados do campeão
  const championData = data.reduce((acc, curr) => {
    const existingGen = acc.find(item => item.generation === curr.generation);
    if (!existingGen || curr.fitness > existingGen.fitness) {
      if (existingGen) {
        acc = acc.filter(item => item.generation !== curr.generation);
      }
      acc.push(curr);
    }
    return acc;
  }, [] as typeof data);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Evolução do Campeão por Geração</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={championData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#8884d8" 
            name="Pontuação Total" 
          />
          <Line 
            type="monotone" 
            dataKey="fitness" 
            stroke="#82ca9d" 
            name="Fitness (Acertos)" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EvolutionChart;