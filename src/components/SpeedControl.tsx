import React from 'react';
import { Slider } from "@/components/ui/slider";

interface SpeedControlProps {
  onSpeedChange: (speed: number) => void;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ onSpeedChange }) => {
  const handleSpeedChange = (value: number[]) => {
    // Exponencial para permitir velocidades muito mais rápidas
    const speed = Math.max(50, 1000 / Math.pow(2, value[0]));
    onSpeedChange(speed);
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Velocidade de Simulação</label>
        <span className="text-sm text-muted-foreground">ms/iteração</span>
      </div>
      <Slider
        defaultValue={[1]}
        max={5}
        min={0}
        step={0.1}
        onValueChange={handleSpeedChange}
      />
    </div>
  );
};

export default SpeedControl;