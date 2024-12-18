import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getLunarPhase, analyzeLunarPatterns } from '@/utils/lunarCalculations';

interface LunarAnalysisProps {
  dates: Date[];
  numbers: number[][];
  recentResults?: number;
}

const LunarAnalysis: React.FC<LunarAnalysisProps> = ({ dates, numbers, recentResults = 100 }) => {
  // Pega apenas os resultados mais recentes
  const recentDates = dates.slice(-recentResults);
  const recentNumbers = numbers.slice(-recentResults);
  
  const patterns = analyzeLunarPatterns(recentDates, recentNumbers);
  
  const chartData = Object.entries(patterns).flatMap(([phase, frequencies]) =>
    frequencies.map((freq, index) => ({
      number: index + 1,
      [phase]: freq,
    }))
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise Lunar (Últimos {recentResults} Sorteios)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="number" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Nova" stroke="#8884d8" />
            <Line type="monotone" dataKey="Crescente" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Cheia" stroke="#ffc658" />
            <Line type="monotone" dataKey="Minguante" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default LunarAnalysis;