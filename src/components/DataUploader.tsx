import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [hasJsonFile, setHasJsonFile] = useState(false);
  const [hasWeightsFile, setHasWeightsFile] = useState(false);

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setHasJsonFile(!!file);
    
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione o arquivo modelo-aprendiz.json",
        variant: "destructive"
      });
      e.target.value = '';
      setHasJsonFile(false);
      return;
    }

    // Verifica se o nome do arquivo está correto
    if (file.name !== 'modelo-aprendiz.json') {
      toast({
        title: "Nome do Arquivo Incorreto",
        description: "O arquivo JSON deve se chamar 'modelo-aprendiz.json'",
        variant: "destructive"
      });
      e.target.value = '';
      setHasJsonFile(false);
    }
  };

  const handleWeightsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setHasWeightsFile(!!file);
    
    if (!file) return;
    
    if (!file.name.endsWith('.bin')) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione o arquivo modelo-aprendiz.weights.bin",
        variant: "destructive"
      });
      e.target.value = '';
      setHasWeightsFile(false);
      return;
    }

    // Verifica se o nome do arquivo está correto
    if (file.name !== 'modelo-aprendiz.weights.bin') {
      toast({
        title: "Nome do Arquivo Incorreto",
        description: "O arquivo de pesos deve se chamar 'modelo-aprendiz.weights.bin'",
        variant: "destructive"
      });
      e.target.value = '';
      setHasWeightsFile(false);
    }
  };

  const handleModelUpload = () => {
    const jsonFile = jsonFileRef.current?.files?.[0];
    const weightsFile = weightsFileRef.current?.files?.[0];
    
    if (!jsonFile || !weightsFile) {
      toast({
        title: "Arquivos Necessários",
        description: "Selecione os arquivos modelo-aprendiz.json e modelo-aprendiz.weights.bin",
        variant: "destructive"
      });
      return;
    }

    onModelUpload(jsonFile, weightsFile);
    toast({
      title: "Arquivos Enviados",
      description: "Modelo e pesos estão sendo carregados..."
    });
  };

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
          
          <Alert className="my-4">
            <AlertDescription>
              Para carregar o modelo treinado, você precisa selecionar os arquivos gerados na página de treinamento:
              1. modelo-aprendiz.json
              2. modelo-aprendiz.weights.bin
            </AlertDescription>
          </Alert>

          <div>
            <label htmlFor="modelJsonInput" className="block mb-2">Carregar Modelo Treinado (JSON):</label>
            <input
              type="file"
              id="modelJsonInput"
              accept=".json"
              ref={jsonFileRef}
              onChange={handleJsonFileChange}
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
              onChange={handleWeightsFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Button 
            onClick={handleModelUpload}
            disabled={!hasJsonFile || !hasWeightsFile}
          >
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