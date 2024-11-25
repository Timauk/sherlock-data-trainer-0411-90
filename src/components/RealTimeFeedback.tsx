import React from 'react'
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { calculatePredictionConfidence } from '../utils/prediction/confidenceCalculator'
import { Player } from '@/types/gameTypes'

interface RealTimeFeedbackProps {
  accuracy: number;
  predictionConfidence: number;
  processingSpeed: number;
  memoryUsage: number;
  champion?: Player | null;
  currentPrediction?: number[];
  historicalData?: number[][];
}

const RealTimeFeedback = ({
  accuracy,
  predictionConfidence,
  processingSpeed,
  memoryUsage,
  champion,
  currentPrediction,
  historicalData
}: RealTimeFeedbackProps) => {
  const { toast } = useToast()
  
  // Calculate real confidence if we have all required data
  const calculatedConfidence = currentPrediction && historicalData ? 
    calculatePredictionConfidence(currentPrediction, champion, historicalData) :
    predictionConfidence;

  React.useEffect(() => {
    if (accuracy < 50) {
      toast({
        title: "Baixa Precisão",
        description: "O modelo está apresentando baixa precisão nas previsões.",
        variant: "destructive"
      })
    }
  }, [accuracy, toast])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feedback em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={accuracy}
          showPercentage
          label="Precisão do Modelo"
        />
        <Progress
          value={calculatedConfidence}
          showPercentage
          label="Confiança da Previsão"
        />
        <Progress
          value={processingSpeed}
          showPercentage
          label="Velocidade de Processamento"
        />
        <Progress
          value={memoryUsage}
          showPercentage
          label="Uso de Memória"
        />
      </CardContent>
    </Card>
  )
}

export default RealTimeFeedback