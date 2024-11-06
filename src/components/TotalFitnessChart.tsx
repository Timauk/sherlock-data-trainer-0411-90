import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TotalFitnessChartProps {
  fitnessData: Array<{
    gameNumber: number;
    totalFitness: number;
  }>;
}

const TotalFitnessChart: React.FC<TotalFitnessChartProps> = ({ fitnessData }) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Fitness Total por Jogo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fitnessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gameNumber" 
                label={{ value: 'Número do Jogo', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Fitness Total', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalFitness" 
                stroke="#10b981" 
                name="Fitness Total" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalFitnessChart;