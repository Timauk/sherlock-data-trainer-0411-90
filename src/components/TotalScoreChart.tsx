import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';

interface TotalScoreChartProps {
  scoreData: Array<{
    gameNumber: number;
    totalScore: number;
  }>;
}

const TotalScoreChart: React.FC<TotalScoreChartProps> = ({ scoreData }) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Pontuação Total por Jogo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gameNumber" 
                label={{ value: 'Número do Jogo', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Pontuação Total', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalScore" 
                stroke="#10b981" 
                name="Pontuação Total" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalScoreChart;