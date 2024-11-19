import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Save, RotateCcw, FolderOpen } from 'lucide-react';
import { saveCheckpoint, loadLastCheckpoint } from '@/utils/fileSystemUtils';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface CheckpointControlsProps {
  savePath: string;
  onSavePathChange: (path: string) => void;
  onAutoSave: () => void;
}

const CheckpointControls: React.FC<CheckpointControlsProps> = ({
  savePath,
  onSavePathChange,
}) => {
  const { toast } = useToast();
  const [inputPath, setInputPath] = useState(savePath);

  const handleSaveCheckpoint = async () => {
    try {
      const gameState = {
        timestamp: new Date().toISOString(),
        path: savePath,
      };

      const savedFile = await saveCheckpoint(gameState);
      
      toast({
        title: "Checkpoint Salvo",
        description: `Arquivo salvo: ${savedFile}`,
      });

    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleLoadCheckpoint = async () => {
    try {
      const checkpoint = await loadLastCheckpoint();
      if (checkpoint) {
        localStorage.setItem('lastCheckpoint', JSON.stringify(checkpoint));
        
        toast({
          title: "Checkpoint Carregado",
          description: "Recarregando página para aplicar as mudanças...",
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Nenhum Checkpoint",
          description: "Não há checkpoint salvo para carregar.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao Carregar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath) {
      onSavePathChange(inputPath);
      localStorage.setItem('checkpointPath', inputPath);
      toast({
        title: "Diretório Atualizado",
        description: "O diretório de salvamento foi atualizado com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handlePathSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            placeholder="Digite o caminho do diretório"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            <FolderOpen className="mr-2 h-4 w-4" /> Definir
          </Button>
        </div>
      </form>

      <div className="p-2 bg-secondary rounded-md">
        <p className="text-sm">Diretório atual: {savePath || "Nenhum diretório selecionado"}</p>
      </div>

      <Button 
        onClick={handleSaveCheckpoint}
        className="w-full"
        disabled={!savePath}
      >
        <Save className="mr-2 h-4 w-4" /> Salvar Checkpoint Manual
      </Button>

      <Button 
        onClick={handleLoadCheckpoint}
        className="w-full"
        disabled={!savePath}
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Carregar Último Checkpoint
      </Button>
    </div>
  );
};

export default CheckpointControls;