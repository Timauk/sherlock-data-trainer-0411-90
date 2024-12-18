import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlayerDetailsProps {
  player?: {
    id: number;
    score: number;
    predictions: number[];
    fitness: number;
    generation: number;
    weights: number[];
  };
  historicalPerformance?: Array<{
    generation: number;
    score: number;
    matches: number;
  }>;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({ player, historicalPerformance = [] }) => {
  if (!player) {
    return (
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle>Nenhum Jogador Selecionado</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const maxPossibleScore = 15;
  const fitnessPercentage = (player.fitness / maxPossibleScore) * 100;
  
  const recentPredictionAccuracy = player.predictions.length > 0
    ? (player.predictions.filter(p => p > 0).length / player.predictions.length) * 100
    : 0;

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Jogador #{player.id}</span>
          <span className="text-sm font-normal">Geração {player.generation}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Fitness Atual</p>
            <Progress value={fitnessPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">{fitnessPercentage.toFixed(1)}%</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Precisão das Previsões Recentes</p>
            <Progress value={recentPredictionAccuracy} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">{recentPredictionAccuracy.toFixed(1)}%</p>
          </div>

          {historicalPerformance.length > 0 && (
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="generation" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" name="Pontuação" />
                  <Line type="monotone" dataKey="matches" stroke="#82ca9d" name="Acertos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerDetails;