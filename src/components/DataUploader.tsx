import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CheckpointControls from './CheckpointControls';

interface DataUploaderProps {
  onCsvUpload: (file: File) => void;
  onModelUpload: (jsonFile: File, weightsFile: File) => void;
  onSaveModel: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onCsvUpload, onModelUpload, onSaveModel }) => {
  const jsonFileRef = useRef<HTMLInputElement>(null);
  const weightsFileRef = useRef<HTMLInputElement>(null);
  const [savePath, setSavePath] = useState(localStorage.getItem('checkpointPath') || '');
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="preparation" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preparation">Preparação</TabsTrigger>
          <TabsTrigger value="checkpoint">Checkpoints</TabsTrigger>
        </TabsList>

        <TabsContent value="preparation" className="space-y-4">
          <div>
            <label htmlFor="csvInput" className="block mb-2">Carregar CSV de Jogos:</label>
            <input
              type="file"
              id="csvInput"
              accept=".csv"
              onChange={(e) => e.target.files && onCsvUpload(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label htmlFor="modelJsonInput" className="block mb-2">Carregar Modelo Treinado (JSON):</label>
            <input
              type="file"
              id="modelJsonInput"
              accept=".json"
              ref={jsonFileRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label htmlFor="modelWeightsInput" className="block mb-2">Carregar Pesos do Modelo (bin):</label>
            <input
              type="file"
              id="modelWeightsInput"
              accept=".bin"
              ref={weightsFileRef}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Button onClick={() => {
            const jsonFile = jsonFileRef.current?.files?.[0];
            const weightsFile = weightsFileRef.current?.files?.[0];
            if (jsonFile && weightsFile) {
              onModelUpload(jsonFile, weightsFile);
            }
          }}>
            <Upload className="mr-2 h-4 w-4" /> Carregar Modelo
          </Button>
        </TabsContent>

        <TabsContent value="checkpoint">
          <CheckpointControls
            savePath={savePath}
            onSavePathChange={setSavePath}
            onAutoSave={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataUploader;