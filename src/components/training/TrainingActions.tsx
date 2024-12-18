import React from 'react';
import { Button } from "@/components/ui/button";
import { BarChart2, Save, Upload } from 'lucide-react';

interface TrainingActionsProps {
  startTraining: () => void;
  saveModel: () => void;
  trainingData: any;
  model: any;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TrainingActions: React.FC<TrainingActionsProps> = ({
  startTraining,
  saveModel,
  trainingData,
  model,
  handleFileUpload
}) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label htmlFor="fileInput" className="block mb-2">Carregar dados (CSV):</label>
        <input
          type="file"
          id="fileInput"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <Button
        onClick={startTraining}
        disabled={!trainingData}
        className="w-full"
      >
        <BarChart2 className="inline-block mr-2" />
        Iniciar Treinamento
      </Button>

      <Button
        onClick={saveModel}
        disabled={!model}
        className="w-full"
      >
        <Save className="inline-block mr-2" />
        Salvar Modelo Base
      </Button>
    </div>
  );
};

export default TrainingActions;