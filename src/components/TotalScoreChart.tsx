import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { exportPredictionsToCSV } from '@/utils/exportUtils';

interface TotalScoreChartProps {
  scoreData: Array<{
    gameNumber: number;
    totalScore: number;
  }>;
  onExportCSV?: () => void;
}

const TotalScoreChart: React.FC<TotalScoreChartProps> = ({ scoreData, onExportCSV }) => {
  // Calcula a média por partida em vez do total acumulado
  const averageScoreData = scoreData.map((data, index) => {
    const previousTotal = index > 0 ? scoreData[index - 1].totalScore : 0;
    return {
      gameNumber: data.gameNumber,
      scorePerGame: data.totalScore - previousTotal // Diferença do total anterior
    };
  });

  return (
    <Card className="w-full mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Pontuação por Jogo
        </CardTitle>
        {onExportCSV && (
          <Button 
            variant="outline" 
            onClick={onExportCSV}
            className="ml-auto"
          >
            Exportar CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={averageScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="gameNumber" 
                label={{ value: 'Número do Jogo', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Pontuação da Partida', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scorePerGame" 
                stroke="#10b981" 
                name="Pontuação da Partida" 
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