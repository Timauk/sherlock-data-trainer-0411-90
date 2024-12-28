import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrainingAdvancedControlsProps {
  learningRate: number;
  setLearningRate: (value: number) => void;
  validationSplit: number;
  setValidationSplit: (value: number) => void;
  optimizer: string;
  setOptimizer: (value: string) => void;
  useEarlyStopping: boolean;
  setUseEarlyStopping: (value: boolean) => void;
}

const TrainingAdvancedControls: React.FC<TrainingAdvancedControlsProps> = ({
  learningRate,
  setLearningRate,
  validationSplit,
  setValidationSplit,
  optimizer,
  setOptimizer,
  useEarlyStopping,
  setUseEarlyStopping
}) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Controles Avançados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Taxa de Aprendizado: {learningRate}</Label>
          <Slider
            value={[learningRate]}
            onValueChange={(value) => setLearningRate(value[0])}
            min={0.0001}
            max={0.01}
            step={0.0001}
          />
        </div>

        <div className="space-y-2">
          <Label>Divisão de Validação: {validationSplit * 100}%</Label>
          <Slider
            value={[validationSplit]}
            onValueChange={(value) => setValidationSplit(value[0])}
            min={0.1}
            max={0.3}
            step={0.05}
          />
        </div>

        <div className="space-y-2">
          <Label>Otimizador</Label>
          <Select value={optimizer} onValueChange={setOptimizer}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o otimizador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adam">Adam</SelectItem>
              <SelectItem value="sgd">SGD</SelectItem>
              <SelectItem value="rmsprop">RMSprop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="early-stopping"
            checked={useEarlyStopping}
            onCheckedChange={setUseEarlyStopping}
          />
          <Label htmlFor="early-stopping">
            Early Stopping
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingAdvancedControls;