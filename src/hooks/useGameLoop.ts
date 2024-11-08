import { useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Player, ModelVisualization } from '@/types/gameTypes';
import { processGameIteration } from '@/utils/gameProcessing/gameIteration';
import { handleModelUpdate } from '@/utils/gameProcessing/modelUpdate';
import { systemLogger } from '@/utils/logging/systemLogger';

export const useGameLoop = (
  players: Player[],
  setPlayers: (players: Player[]) => void,
  csvData: number[][],
  trainedModel: tf.LayersModel | null,
  concursoNumber: number,
  setEvolutionData: (data: any) => void,
  generation: number,
  addLog: (message: string, matches?: number) => void,
  updateInterval: number,
  trainingData: number[][],
  setTrainingData: React.Dispatch<React.SetStateAction<number[][]>>,
  setNumbers: React.Dispatch<React.SetStateAction<number[][]>>,
  setDates: React.Dispatch<React.SetStateAction<Date[]>>,
  setNeuralNetworkVisualization: (vis: ModelVisualization | null) => void,
  setBoardNumbers: (numbers: number[]) => void,
  setModelMetrics: (metrics: any) => void,
  setConcursoNumber: (num: number) => void,
  setGameCount: React.Dispatch<React.SetStateAction<number>>,
  showToast?: (title: string, description: string) => void
) => {
  const gameLoop = useCallback(async () => {
    if (csvData.length === 0 || !trainedModel) {
      systemLogger.log('system', 'Jogo não pode continuar - Dados ou modelo ausentes');
      return;
    }

    const nextConcurso = concursoNumber + 1;
    if (nextConcurso >= csvData.length) {
      systemLogger.log('system', 'Processamento finalizado - Todos os concursos analisados');
      showToast?.("Fim dos Dados", "Todos os jogos foram processados!");
      return;
    }

    // Primeiro, atualiza o número do concurso e aguarda a atualização
    await new Promise<void>(resolve => {
      setConcursoNumber(nextConcurso);
      setTimeout(resolve, 100); // Pequeno delay para garantir a atualização
    });

    // Atualiza o contador de jogos
    await new Promise<void>(resolve => {
      setGameCount(prev => prev + 1);
      setTimeout(resolve, 50);
    });

    // Obtém e valida os números atuais da banca
    const currentBoardNumbers = csvData[nextConcurso];
    if (!currentBoardNumbers || currentBoardNumbers.length !== 15) {
      systemLogger.log('system', `Erro: Dados inválidos no concurso ${nextConcurso}`);
      return;
    }

    // Atualiza os números da banca e aguarda
    await new Promise<void>(resolve => {
      setBoardNumbers(currentBoardNumbers);
      setTimeout(resolve, 100);
    });

    systemLogger.log('system', `Processando concurso #${nextConcurso} - Números: ${currentBoardNumbers.join(',')}`);

    try {
      const { updatedPlayers, metrics } = await processGameIteration({
        players,
        csvData,
        nextConcurso,
        trainedModel,
        generation,
        addLog,
        setNeuralNetworkVisualization,
        showToast
      });

      // Atualiza os estados com delays entre cada atualização
      await new Promise<void>(resolve => {
        setPlayers(updatedPlayers);
        setTimeout(resolve, 50);
      });

      await new Promise<void>(resolve => {
        setModelMetrics(metrics);
        setTimeout(resolve, 50);
      });

      await new Promise<void>(resolve => {
        setEvolutionData(prev => [
          ...prev,
          ...updatedPlayers.map(player => ({
            generation,
            playerId: player.id,
            score: player.score,
            fitness: player.fitness
          }))
        ]);
        setTimeout(resolve, 50);
      });

      await handleModelUpdate({
        nextConcurso,
        updateInterval,
        trainedModel,
        trainingData,
        setTrainingData,
        addLog,
        showToast
      });

      // Aguarda um intervalo maior antes de agendar o próximo loop
      const baseDelay = Math.max(200, Math.min(1000, updateInterval));
      await new Promise(resolve => setTimeout(resolve, baseDelay));

      // Agenda o próximo loop com um intervalo maior
      setTimeout(gameLoop, baseDelay * 1.5);

    } catch (error) {
      systemLogger.log('system', 'Erro durante processamento do concurso', { error });
      console.error('Erro no loop do jogo:', error);
      showToast?.("Erro no Processamento", "Ocorreu um erro durante o processamento do jogo");
    }
  }, [
    players,
    setPlayers,
    csvData,
    trainedModel,
    concursoNumber,
    setEvolutionData,
    generation,
    addLog,
    updateInterval,
    trainingData,
    setTrainingData,
    setNumbers,
    setDates,
    setNeuralNetworkVisualization,
    setBoardNumbers,
    setModelMetrics,
    setConcursoNumber,
    setGameCount,
    showToast
  ]);

  return gameLoop;
};