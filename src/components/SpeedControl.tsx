import React from 'react';
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface SpeedControlProps {
  onSpeedChange: (speed: number) => void;
}

const SpeedControl: React.FC<SpeedControlProps> = ({ onSpeedChange }) => {
  const { toast } = useToast();

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = 2000 - value[0];
    onSpeedChange(newSpeed);
    toast({
      title: "Velocidade Ajustada",
      description: `${newSpeed}ms por jogada`,
    });
  };

  return (
    <div className="mb-4 p-4 bg-background rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Controle de Velocidade</h3>
      <Slider
        defaultValue={[1000]}
        max={1900}
        min={100}
        step={100}
        onValueChange={handleSpeedChange}
        className="w-full"
      />
      <p className="text-sm text-muted-foreground mt-1">
        Intervalo atual: {2000 - 1000}ms
      </p>
    </div>
  );
};

export default SpeedControl;