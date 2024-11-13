import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface TotalScoreChartProps {
  scoreData: Array<{
    gameNumber: number;
    totalScore: number;
  }>;
  onExportCSV?: () => void;
}

const TotalScoreChart: React.FC<TotalScoreChartProps> = ({ scoreData, onExportCSV }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!onExportCSV) return;
    
    setIsExporting(true);
    try {
      await onExportCSV();
      toast({
        title: "Exportação Concluída",
        description: "O histórico completo de jogos foi exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Ocorreu um erro ao exportar o histórico de jogos.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calcula a média por partida em vez do total acumulado
  const averageScoreData = scoreData.map((data, index) => {
    const previousTotal = index > 0 ? scoreData[index - 1].totalScore : 0;
    return {
      gameNumber: data.gameNumber,
      scorePerGame: data.totalScore - previousTotal
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
            onClick={handleExport}
            disabled={isExporting}
            className="ml-auto"
          >
            {isExporting ? "Exportando..." : "Exportar Histórico Completo"}
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