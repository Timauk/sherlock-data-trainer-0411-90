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

    // Atualiza o número do concurso e os números da banca de forma síncrona
    await Promise.all([
      new Promise<void>(resolve => {
        setConcursoNumber(nextConcurso);
        resolve();
      }),
      new Promise<void>(resolve => {
        setGameCount(prev => prev + 1);
        resolve();
      })
    ]);

    // Obtém os números atuais da banca
    const currentBoardNumbers = csvData[nextConcurso];
    if (!currentBoardNumbers || currentBoardNumbers.length !== 15) {
      systemLogger.log('system', `Erro: Dados inválidos no concurso ${nextConcurso}`);
      return;
    }

    // Atualiza os números da banca de forma síncrona
    await new Promise<void>(resolve => {
      setBoardNumbers(currentBoardNumbers);
      resolve();
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

      // Atualiza os estados de forma síncrona
      await Promise.all([
        new Promise<void>(resolve => {
          setPlayers(updatedPlayers);
          resolve();
        }),
        new Promise<void>(resolve => {
          setModelMetrics(metrics);
          resolve();
        }),
        new Promise<void>(resolve => {
          setEvolutionData(prev => [
            ...prev,
            ...updatedPlayers.map(player => ({
              generation,
              playerId: player.id,
              score: player.score,
              fitness: player.fitness
            }))
          ]);
          resolve();
        })
      ]);

      await handleModelUpdate({
        nextConcurso,
        updateInterval,
        trainedModel,
        trainingData,
        setTrainingData,
        addLog,
        showToast
      });

      // Aguarda um pequeno intervalo para garantir que todas as atualizações foram processadas
      await new Promise(resolve => setTimeout(resolve, Math.max(50, Math.min(500, updateInterval / 2))));

      // Agenda o próximo loop com um intervalo baseado na velocidade
      setTimeout(gameLoop, Math.max(50, Math.min(1000, updateInterval)));

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