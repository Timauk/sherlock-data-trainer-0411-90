import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartLine, TreeDeciduous, Brain, Dna } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

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

const NICHE_CONFIG = {
  'Pares': {
    color: '#3B82F6',
    icon: ChartLine,
    description: 'Especializado em números pares'
  },
  'Ímpares': {
    color: '#10B981',
    icon: TreeDeciduous,
    description: 'Especializado em números ímpares'
  },
  'Sequências': {
    color: '#8B5CF6',
    icon: Brain,
    description: 'Especializado em sequências numéricas'
  },
  'Geral': {
    color: '#F97316',
    icon: Dna,
    description: 'Comportamento generalista'
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold">Geração {label}</p>
        {payload.map((entry: any, index: number) => {
          const nicheName = entry.name;
          const config = NICHE_CONFIG[nicheName];
          const Icon = config.icon;
          
          return (
            <div key={index} className="flex items-center gap-2 mt-2">
              <Icon size={16} color={config.color} />
              <span style={{ color: config.color }}>
                {nicheName}: {entry.value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const GeneticEvolutionChart: React.FC<GeneticEvolutionChartProps> = ({ evolutionData }) => {
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dna className="h-6 w-6" />
          Histórico de Evolução Genética por Nicho
        </CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {Object.entries(NICHE_CONFIG).map(([niche, config]) => {
            const Icon = config.icon;
            return (
              <Badge
                key={niche}
                variant="outline"
                className="flex items-center gap-2 p-2"
                style={{ borderColor: config.color }}
              >
                <Icon size={16} color={config.color} />
                <div className="flex flex-col">
                  <span className="font-semibold">{niche}</span>
                  <span className="text-xs text-muted-foreground">{config.description}</span>
                </div>
              </Badge>
            );
          })}
        </div>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {Object.entries(NICHE_CONFIG).map(([niche, config]) => (
                <Line
                  key={niche}
                  type="monotone"
                  dataKey={`nicheData.${niche}.avgFitness`}
                  name={niche}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
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