import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FrequencyAnalysisProps {
  numbers: number[][];
  onFrequencyUpdate?: (frequencies: { [key: string]: number[] }) => void;
}

const FrequencyAnalysis: React.FC<FrequencyAnalysisProps> = ({ numbers, onFrequencyUpdate }) => {
  const ranges = [3, 5, 7, 10, 15];
  
  const calculateFrequency = (lastN: number) => {
    const frequency: { [key: number]: number } = {};
    const recentGames = numbers.slice(-lastN);
    let totalGames = recentGames.length;
    
    // Initialize frequency count
    for (let i = 1; i <= 25; i++) {
      frequency[i] = 0;
    }
    
    // Count occurrences
    recentGames.forEach(game => {
      game.forEach(number => {
        frequency[number]++;
      });
    });
    
    // Convert to percentage
    const frequencyArray = Object.entries(frequency).map(([number, count]) => ({
      number: parseInt(number),
      frequency: count,
      percentage: ((count / (totalGames * 15)) * 100).toFixed(2)
    })).sort((a, b) => b.frequency - a.frequency);

    return frequencyArray;
  };

  // Update parent component with frequency data for AI training
  React.useEffect(() => {
    if (onFrequencyUpdate) {
      const frequencyData = ranges.reduce((acc, range) => {
        const freqs = calculateFrequency(range);
        acc[`last${range}`] = freqs.map(f => f.frequency);
        return acc;
      }, {} as { [key: string]: number[] });
      
      onFrequencyUpdate(frequencyData);
    }
  }, [numbers, onFrequencyUpdate]);

  const prepareChartData = (range: number) => {
    const data = calculateFrequency(range);
    return data.map(item => ({
      number: item.number,
      frequência: parseFloat(item.percentage)
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise de Frequência</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="3">
          <TabsList className="w-full">
            {ranges.map(range => (
              <TabsTrigger key={range} value={range.toString()}>
                Últimos {range} jogos
              </TabsTrigger>
            ))}
          </TabsList>

          {ranges.map(range => (
            <TabsContent key={range} value={range.toString()}>
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={prepareChartData(range)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="number" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="frequência" 
                      stroke="#8884d8" 
                      name="Frequência (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Porcentagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculateFrequency(range).map(({ number, frequency, percentage }) => (
                      <TableRow key={number}>
                        <TableCell>{number}</TableCell>
                        <TableCell>{frequency}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FrequencyAnalysis;