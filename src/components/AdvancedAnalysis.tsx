import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdvancedAnalysisProps {
  numbers: number[][];
  dates: Date[];
}

const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ numbers, dates }) => {
  const calculatePatterns = () => {
    const patterns = {
      consecutive: 0,
      evenOdd: 0,
      sumRange: [] as number[],
      gaps: [] as number[]
    };

    numbers.forEach(draw => {
      // Análise de números consecutivos
      for (let i = 1; i < draw.length; i++) {
        if (draw[i] === draw[i-1] + 1) patterns.consecutive++;
      }

      // Análise par/ímpar
      const evenCount = draw.filter(n => n % 2 === 0).length;
      patterns.evenOdd += evenCount / draw.length;

      // Soma total
      patterns.sumRange.push(draw.reduce((a, b) => a + b, 0));

      // Análise de gaps
      for (let i = 1; i < draw.length; i++) {
        patterns.gaps.push(draw[i] - draw[i-1]);
      }
    });

    return patterns;
  };

  const patterns = calculatePatterns();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Análise Avançada de Padrões</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patterns">
          <TabsList>
            <TabsTrigger value="patterns">Padrões</TabsTrigger>
            <TabsTrigger value="distribution">Distribuição</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Números Consecutivos</h4>
                <p className="text-2xl font-bold">{patterns.consecutive}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Proporção Par/Ímpar</h4>
                <p className="text-2xl font-bold">{(patterns.evenOdd / numbers.length).toFixed(2)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patterns.sumRange.map((sum, index) => ({ index, sum }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sum" stroke="#8884d8" name="Soma Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patterns.gaps.map((gap, index) => ({ index, gap }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gap" stroke="#82ca9d" name="Gaps entre Números" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedAnalysis;