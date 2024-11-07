import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TotalFitnessChartProps {
  fitnessData?: Array<{
    gameNumber: number;
    totalFitness: number;
  }>;
}

const TotalFitnessChart: React.FC<TotalFitnessChartProps> = ({ fitnessData = [] }) => {
  // Mantém histórico completo sem sobrescrever dados anteriores
  const historicalData = (fitnessData || []).map((data, index) => ({
    gameNumber: data.gameNumber,
    totalFitness: data.totalFitness,
    cycleNumber: Math.floor(index / 15) + 1 // Assumindo que cada ciclo tem 15 jogos
  }));

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Histórico de Fitness por Jogo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="gameNumber" 
                  label={{ value: 'Número do Jogo', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Fitness Total', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}`, 
                    'Fitness Total'
                  ]}
                  labelFormatter={(label) => `Jogo ${label} (Ciclo ${historicalData[label-1]?.cycleNumber})`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalFitness" 
                  stroke="#10b981" 
                  name="Fitness Total" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalFitnessChart;