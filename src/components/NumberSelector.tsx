import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from 'lucide-react';

interface NumberSelectorProps {
  onNumbersSelected: (numbers: number[]) => void;
  predictions?: Array<{ numbers: number[] }>;
}

const NumberSelector: React.FC<NumberSelectorProps> = ({ onNumbersSelected, predictions }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const { toast } = useToast();

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
    } else if (selectedNumbers.length < 15) {
      setSelectedNumbers(prev => [...prev, num].sort((a, b) => a - b));
      onNumbersSelected([...selectedNumbers, num].sort((a, b) => a - b));
    } else {
      toast({
        title: "Limite Atingido",
        description: "Você já selecionou 15 números",
        variant: "destructive"
      });
    }
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
    onNumbersSelected([]);
    toast({
      title: "Seleção Limpa",
      description: "Todos os números foram desmarcados",
    });
  };

  const getMatchCount = (predictionNumbers: number[]) => {
    return predictionNumbers.filter(num => selectedNumbers.includes(num)).length;
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Selecione 15 Números para Comparação</CardTitle>
          <Button 
            variant="outline" 
            onClick={clearSelection}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Seleção
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
            <Button
              key={num}
              variant={selectedNumbers.includes(num) ? "default" : "outline"}
              onClick={() => toggleNumber(num)}
              className="w-full h-12 text-lg font-bold"
            >
              {num.toString().padStart(2, '0')}
            </Button>
          ))}
        </div>
        
        {selectedNumbers.length === 15 && predictions && predictions.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Comparação com Previsões:</h3>
            {predictions.map((pred, idx) => (
              <div key={idx} className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div>Jogo {idx + 1}: {getMatchCount(pred.numbers)} acertos</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NumberSelector;