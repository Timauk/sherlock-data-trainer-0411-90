import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SpeedControlProps {
  onSpeedChange: (speed: number) => void;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ onSpeedChange }) => {
  const handleSpeedChange = (value: number[]) => {
    // Exponencial para permitir velocidades muito mais rápidas
    // Mínimo de 50ms, máximo de 1000ms
    const speed = Math.max(50, Math.min(1000, Math.pow(2, 10 - value[0])));
    onSpeedChange(speed);
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Velocidade de Simulação</Label>
        <span className="text-sm text-muted-foreground">ms/iteração</span>
      </div>
      <Slider
        defaultValue={[5]}
        max={10}
        min={0}
        step={0.1}
        onValueChange={handleSpeedChange}
        className="w-full"
      />
    </div>
  );
};

export default SpeedControl;