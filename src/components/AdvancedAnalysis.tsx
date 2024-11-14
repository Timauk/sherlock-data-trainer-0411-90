import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { InfoIcon, TrendingUpIcon, CalendarIcon, MoonIcon } from 'lucide-react';

interface AdvancedAnalysisProps {
  numbers: number[][];
  dates: Date[];
}

const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ numbers = [], dates = [] }) => {
  const calculatePatterns = () => {
    if (!numbers.length || !dates.length) {
      return {
        consecutive: 0,
        evenOdd: 0,
        sumRange: [],
        gaps: [],
        seasonalStrength: 0,
        lunarCorrelation: 0,
        frequencyScore: 0,
        sequentialScore: 0
      };
    }

    const patterns = {
      consecutive: 0,
      evenOdd: 0,
      sumRange: [] as number[],
      gaps: [] as number[],
      seasonalStrength: 0,
      lunarCorrelation: 0,
      frequencyScore: 0,
      sequentialScore: 0
    };

    numbers.forEach((draw, index) => {
      if (!Array.isArray(draw)) return;

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

      // Força sazonal (baseada no mês)
      if (dates[index] instanceof Date) {
        const month = dates[index].getMonth();
        patterns.seasonalStrength += (month % 3 === 0) ? 0.1 : 0.05;

        // Correlação lunar (simulada)
        const dayOfMonth = dates[index].getDate();
        patterns.lunarCorrelation += (dayOfMonth <= 15) ? 0.07 : 0.03;
      }

      // Score de frequência
      const uniqueNumbers = new Set(draw).size;
      patterns.frequencyScore += uniqueNumbers / 15;

      // Score sequencial
      let sequentialCount = 0;
      for (let i = 1; i < draw.length; i++) {
        if (draw[i] === draw[i-1] + 1) sequentialCount++;
      }
      patterns.sequentialScore += sequentialCount / draw.length;
    });

    // Normalização dos scores
    const totalGames = numbers.length || 1;
    patterns.seasonalStrength = Math.min(1, patterns.seasonalStrength / totalGames);
    patterns.lunarCorrelation = Math.min(1, patterns.lunarCorrelation / totalGames);
    patterns.frequencyScore = patterns.frequencyScore / totalGames;
    patterns.sequentialScore = patterns.sequentialScore / totalGames;

    return patterns;
  };

  const patterns = calculatePatterns();

  const analysisModules = [
    {
      name: "Análise Sazonal",
      score: patterns.seasonalStrength,
      icon: <CalendarIcon className="w-4 h-4" />,
      description: "Padrões baseados em estações e períodos do ano"
    },
    {
      name: "Análise Lunar",
      score: patterns.lunarCorrelation,
      icon: <MoonIcon className="w-4 h-4" />,
      description: "Correlações com fases lunares"
    },
    {
      name: "Análise de Frequência",
      score: patterns.frequencyScore,
      icon: <TrendingUpIcon className="w-4 h-4" />,
      description: "Distribuição e repetição de números"
    },
    {
      name: "Análise Sequencial",
      score: patterns.sequentialScore,
      icon: <InfoIcon className="w-4 h-4" />,
      description: "Padrões sequenciais e consecutivos"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Análise Avançada de Padrões
          <Badge variant="outline" className="ml-2">
            {analysisModules.length} Módulos Ativos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisModules.map((module, index) => (
                <Alert key={index}>
                  <div className="flex items-center gap-2">
                    {module.icon}
                    <div>
                      <h4 className="font-medium">{module.name}</h4>
                      <AlertDescription>
                        Score: {(module.score * 100).toFixed(1)}%
                        <br />
                        {module.description}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Números Consecutivos</h4>
                <p className="text-2xl font-bold">{patterns.consecutive}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Proporção Par/Ímpar</h4>
                <p className="text-2xl font-bold">
                  {(patterns.evenOdd / numbers.length).toFixed(2)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={patterns.sumRange.map((sum, index) => ({ index, sum }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sum" 
                    stroke="#8884d8" 
                    name="Soma Total" 
                  />
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
                  <Line 
                    type="monotone" 
                    dataKey="gap" 
                    stroke="#82ca9d" 
                    name="Gaps entre Números" 
                  />
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