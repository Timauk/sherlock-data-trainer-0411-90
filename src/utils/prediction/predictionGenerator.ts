import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { decisionTreeSystem } from '../learning/decisionTree.js';
import { TFDecisionTree } from '../learning/tfDecisionTree';
import * as tf from '@tensorflow/tfjs';
import { enrichTrainingData } from '../features/lotteryFeatureEngineering';

const tfDecisionTreeInstance = new TFDecisionTree();

interface PredictionResult {
  numbers: number[];
  estimatedAccuracy: number;
  targetMatches: number;
  matchesWithSelected: number;
  isGoodDecision: boolean;
}

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[] = []
): Promise<PredictionResult[]> => {
  systemLogger.log('prediction', 'Iniciando geração de 8 jogos', {
    championId: champion.id,
    weightsLength: champion.weights.length,
    lastNumbers: lastConcursoNumbers,
    timestamp: new Date().toISOString()
  });

  const predictions: PredictionResult[] = [];
  
  try {
    if (!trainedModel || !trainedModel.layers || trainedModel.layers.length === 0) {
      throw new Error('Modelo neural inválido ou não inicializado');
    }

    // Enriquecer dados de entrada
    const currentDate = new Date();
    const enrichedData = enrichTrainingData([[...lastConcursoNumbers]], [currentDate]);
    
    if (!enrichedData || !enrichedData[0]) {
      throw new Error('Falha ao enriquecer dados de entrada');
    }

    // Criar tensor de entrada com o shape correto [1, 13072]
    const paddedInput = new Array(13072).fill(0);
    for (let i = 0; i < enrichedData[0].length && i < 13072; i++) {
      paddedInput[i] = enrichedData[0][i];
    }

    const inputTensor = tf.tensor2d([paddedInput]);

    // Gerar 8 jogos diferentes
    for (let gameIndex = 0; gameIndex < 8; gameIndex++) {
      systemLogger.log('prediction', `Iniciando geração do jogo #${gameIndex + 1}`, {
        championId: champion.id,
        gameIndex,
        timestamp: new Date().toISOString()
      });

      // Aplicar modelo neural para gerar probabilidades
      const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
      const modelProbs = Array.from(await prediction.data());

      // Combinar probabilidades com pesos do campeão
      const weightedProbs = modelProbs.map((prob, idx) => ({
        number: (idx % 25) + 1,
        probability: prob * (champion.weights[idx % champion.weights.length] / 1000)
      }));

      // Ordenar por probabilidade e selecionar os 15 números mais prováveis
      weightedProbs.sort((a, b) => b.probability - a.probability);
      const selectedNumbers = weightedProbs
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);

      // Calcular estimativa de precisão
      const estimatedAccuracy = weightedProbs
        .slice(0, 15)
        .reduce((acc, curr) => acc + curr.probability, 0) / 15 * 100;

      predictions.push({
        numbers: selectedNumbers,
        estimatedAccuracy,
        targetMatches: 11 + (gameIndex % 5), // Variando entre 11 e 15
        matchesWithSelected: selectedNumbers.filter(n => lastConcursoNumbers.includes(n)).length,
        isGoodDecision: estimatedAccuracy > 50
      });

      prediction.dispose();
    }

    inputTensor.dispose();

    systemLogger.log('prediction', 'Resumo da geração de jogos', {
      championId: champion.id,
      totalGames: predictions.length,
      predictions: predictions.map(p => ({
        numbers: p.numbers,
        accuracy: p.estimatedAccuracy,
        matches: p.matchesWithSelected
      }))
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração de predições', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      championId: champion.id,
      modelState: trainedModel ? 'exists' : 'null'
    });
    throw error;
  }
};