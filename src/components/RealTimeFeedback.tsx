import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RealTimeFeedbackProps {
  accuracy: number;
  predictionConfidence: number;
  processingSpeed: number;
  memoryUsage: number;
}

const RealTimeFeedback: React.FC<RealTimeFeedbackProps> = ({
  accuracy,
  predictionConfidence,
  processingSpeed,
  memoryUsage
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Precisão</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={accuracy} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{accuracy.toFixed(2)}%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Confiança</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={predictionConfidence} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{predictionConfidence.toFixed(2)}%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Velocidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={processingSpeed} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{processingSpeed.toFixed(2)}%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Memória</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={memoryUsage} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{memoryUsage.toFixed(2)}%</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeFeedback;