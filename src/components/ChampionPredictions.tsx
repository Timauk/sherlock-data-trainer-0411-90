// Importação das bibliotecas do React
import React, { useState, useEffect, useCallback } from 'react';

// Importação de componentes de interface (UI)
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast"; // Hook para exibir notificações
import { Player } from '@/types/gameTypes'; // Tipo que define um jogador (champion)

// Importação de bibliotecas auxiliares
import * as tf from '@tensorflow/tfjs'; // TensorFlow.js para aprendizado de máquina

// Importação de componentes personalizados
import NumberSelector from './NumberSelector'; // Componente para selecionar números
import PredictionsList from './PredictionsList'; // Lista de previsões geradas
import { generatePredictions } from '../utils/prediction/predictionGenerator'; // Função para gerar previsões
import { systemLogger } from '../utils/logging/systemLogger'; // Logger para registrar eventos do sistema
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"; // Ícones de estado visual

// Componentes e tipos adicionais
import { PredictionsHeader } from './predictions/PredictionsHeader'; // Cabeçalho de previsões
import { PredictionResult } from './predictions/types'; // Tipo que representa uma previsão

// Propriedades esperadas pelo componente
interface ChampionPredictionsProps {
  champion: Player | undefined; // Jogador campeão
  trainedModel: tf.LayersModel | null; // Modelo de aprendizado treinado
  lastConcursoNumbers: number[]; // Números do último concurso
  isServerProcessing?: boolean; // Indica se o servidor está processando
  csvProgress?: number; // Progresso do carregamento do CSV
}

// Componente principal: responsável por gerenciar as previsões do campeão
const ChampionPredictions: React.FC<ChampionPredictionsProps> = ({
  champion, // Jogador campeão
  trainedModel, // Modelo treinado
  lastConcursoNumbers, // Números do último concurso
  isServerProcessing = false, // Indica se o processamento ocorre no servidor
  csvProgress = 0 // Progresso do CSV, padrão é 0
}) => {
  /**
   * Estados Locais
   */
  const [predictions, setPredictions] = useState<PredictionResult[]>([]); // Previsões geradas
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]); // Números selecionados pelo usuário
  const [isGenerating, setIsGenerating] = useState(false); // Indica se as previsões estão sendo geradas
  const [systemReady, setSystemReady] = useState(false); // Indica se o sistema está pronto
  const { toast } = useToast(); // Hook para exibir mensagens ao usuário

  /**
   * Função para verificar os itens que faltam para o sistema estar pronto.
   * - Retorna uma lista de itens ausentes: "campeão", "modelo", ou "números do último concurso".
   */
  const getMissingItems = useCallback(() => {
    const items = [];
    if (!champion) items.push('campeão'); // Verifica se o campeão está ausente
    if (!trainedModel) items.push('modelo'); // Verifica se o modelo treinado está ausente
    if (!lastConcursoNumbers?.length) items.push('números do último concurso'); // Verifica os números
    return items;
  }, [champion, trainedModel, lastConcursoNumbers]);

  /**
   * Monitora mudanças nos dados do sistema e registra status no logger.
   * - Evita atualizações de estado durante a renderização.
   */
  useEffect(() => {
    const items = getMissingItems();
    if (items.length > 0) {
      systemLogger.debug('system', 'Status dos componentes', {
        champion: {
          exists: !!champion, // Verifica se o campeão existe
          type: typeof champion, // Tipo do objeto campeão
          hasId: champion?.id !== undefined, // Se possui ID
        },
        model: {
          loaded: !!trainedModel, // Modelo carregado?
          type: typeof trainedModel, // Tipo do modelo
        },
        lastNumbers: {
          exists: !!lastConcursoNumbers, // Os números existem?
          length: lastConcursoNumbers?.length, // Quantidade de números
        },
      });
    }
  }, [champion, trainedModel, lastConcursoNumbers, getMissingItems]);

  /**
   * Função que retorna o status atual do sistema.
   * - Mostra mensagens e estilos com base nos itens ausentes.
   */
  const getSystemStatus = useCallback(() => {
    const missingItems = getMissingItems();
    if (!systemReady || missingItems.length > 0) {
      return {
        color: 'bg-yellow-500', // Fundo amarelo para indicar alerta
        text: `Aguardando: ${missingItems.join(', ')}`, // Itens ausentes listados
        icon: <AlertCircle className="h-4 w-4" />, // Ícone de alerta
        ready: false, // Indica que o sistema não está pronto
      };
    }
    return {
      color: 'bg-green-500', // Fundo verde para indicar prontidão
      text: 'Sistema Pronto para Gerar!', // Mensagem de sucesso
      icon: <CheckCircle2 className="h-4 w-4" />, // Ícone de sucesso
      ready: true, // Indica que o sistema está pronto
    };
  }, [systemReady, getMissingItems]);

  /**
   * Atualiza os números selecionados e marca "matches" nas previsões geradas.
   */
  const handleNumbersSelected = useCallback((numbers: number[]) => {
    setSelectedNumbers(numbers); // Atualiza o estado dos números selecionados
    setPredictions(prev =>
      prev.map(pred => ({
        ...pred,
        matchesWithSelected: pred.numbers.filter(n => numbers.includes(n)).length, // Calcula "matches"
      }))
    );
  }, []);

  /**
   * Gera previsões com base no modelo treinado, no campeão e nos números.
   */
  const generatePredictionsHandler = useCallback(async () => {
    if (!systemReady) {
      const missingItems = getMissingItems();
      toast({
        title: "Sistema em Preparação",
        description: `Aguardando: ${missingItems.join(', ')}`,
      });
      return;
    }

    setIsGenerating(true); // Define que o sistema está gerando previsões
    try {
      const newPredictions = await generatePredictions(
        champion!, // Dados do campeão
        trainedModel!, // Modelo treinado
        lastConcursoNumbers, // Últimos números
        selectedNumbers // Números escolhidos
      );

      if (!newPredictions?.length) {
        throw new Error("Não foi possível gerar previsões");
      }

      setPredictions(newPredictions); // Atualiza as previsões no estado
      systemLogger.log('prediction', `8 jogos gerados pelo campeão #${champion!.id}`);
      toast({
        title: "Previsões Geradas",
        description: "8 jogos foram gerados com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar previsões:", error);
      toast({
        title: "Erro",
        description: `Erro ao gerar previsões: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false); // Define que terminou o processo
    }
  }, [systemReady, champion, trainedModel, lastConcursoNumbers, selectedNumbers, toast, getMissingItems]);

  /**
   * Verifica se o sistema está pronto (todos os dados estão disponíveis).
   */
  useEffect(() => {
    const allDataLoaded = Boolean(champion && trainedModel && lastConcursoNumbers?.length > 0);
    setSystemReady(allDataLoaded); // Atualiza o estado `systemReady`

    if (allDataLoaded) {
      toast({
        title: "Sistema Pronto",
        description: "Todos os dados foram carregados com sucesso.",
      });
      systemLogger.log('system', 'Sistema pronto para gerar previsões');
    }
  }, [champion, trainedModel, lastConcursoNumbers, toast]);

  /**
   * Gera previsões automaticamente quando o progresso do CSV atinge 100%.
   */
  useEffect(() => {
    if (csvProgress >= 100 && systemReady && !isGenerating && !predictions.length) {
      generatePredictionsHandler(); // Chama a geração automática
    }
  }, [csvProgress, systemReady, isGenerating, predictions.length, generatePredictionsHandler]);

  /**
   * Renderização do componente.
   */
  return (
    <div className="space-y-4">
      {/* Componente de seleção de números */}
      <NumberSelector 
        onNumbersSelected={handleNumbersSelected} 
        predictions={predictions}
      />
      
      {/* Cartão contendo previsões e status */}
      <Card className="mt-4">
        <CardHeader>
          {/* Cabeçalho mostrando o status do sistema */}
          <PredictionsHeader 
            status={getSystemStatus()}
            isGenerating={isGenerating}
            onGenerate={generatePredictionsHandler}
            isServerProcessing={isServerProcessing}
          />
        </CardHeader>
        <CardContent>
          {/* Lista de previsões ou mensagem aguardando */}
          {predictions.length > 0 ? (
            <PredictionsList 
              predictions={predictions} 
              selectedNumbers={selectedNumbers}
            />
          ) : (
            <div className="flex justify-center items-center h-full text-gray-500">
              Aguardando entrada de dados ou processamento...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChampionPredictions;
