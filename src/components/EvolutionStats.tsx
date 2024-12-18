import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionStatsProps {
  gameCount: number;
  nextCloneAt: number;
  generationStats: Array<{
    generation: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
  }>;
}

const EvolutionStats: React.FC<EvolutionStatsProps> = ({
  gameCount,
  nextCloneAt,
  generationStats
}) => {
  const progress = (gameCount % nextCloneAt) / nextCloneAt * 100;
  const gamesUntilClone = nextCloneAt - (gameCount % nextCloneAt);

  // Agrupa os dados por geração para evitar flutuações
  const consolidatedStats = generationStats.reduce((acc, curr) => {
    const existingGen = acc.find(stat => stat.generation === curr.generation);
    if (existingGen) {
      // Atualiza apenas se a pontuação for melhor
      existingGen.bestScore = Math.max(existingGen.bestScore, curr.bestScore);
      existingGen.worstScore = Math.min(existingGen.worstScore, curr.worstScore);
      // Mantém a média mais recente
      existingGen.averageScore = curr.averageScore;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as typeof generationStats);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progresso até Próxima Clonagem</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full mb-2" />
          <p className="text-sm text-muted-foreground">
            Faltam {gamesUntilClone} jogos para próxima clonagem
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução das Gerações</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pontuação total acumulada por geração
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consolidatedStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="generation" 
                  label={{ value: 'Geração', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Pontuação', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="bestScore" 
                  stroke="#10b981" 
                  name="Melhor Pontuação Total" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  stroke="#6366f1" 
                  name="Média da Geração" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="worstScore" 
                  stroke="#ef4444" 
                  name="Pior Pontuação Total" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionStats;