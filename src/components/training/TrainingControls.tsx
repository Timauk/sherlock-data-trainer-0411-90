import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrainingControlsProps {
  epochs: number;
  setEpochs: (value: number) => void;
  batchSize: string;
  setBatchSize: (value: string) => void;
}

const TrainingControls: React.FC<TrainingControlsProps> = ({
  epochs,
  setEpochs,
  batchSize,
  setBatchSize
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="epochs">Número de Épocas</Label>
        <Input
          id="epochs"
          type="number"
          value={epochs}
          onChange={(e) => setEpochs(Number(e.target.value))}
          min={1}
          max={1000}
          className="w-[180px]"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Batch Size</Label>
        <Select value={batchSize} onValueChange={setBatchSize}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Batch Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="32">Batch Size: 32</SelectItem>
            <SelectItem value="16">Batch Size: 16</SelectItem>
            <SelectItem value="8">Batch Size: 8</SelectItem>
            <SelectItem value="4">Batch Size: 4</SelectItem>
            <SelectItem value="2">Batch Size: 2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TrainingControls;