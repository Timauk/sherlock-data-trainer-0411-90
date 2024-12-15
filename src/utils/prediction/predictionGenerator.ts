import { Player } from '@/types/gameTypes';
import { systemLogger } from '../logging/systemLogger';
import { decisionTreeSystem } from '../learning/decisionTree.js';
import { TFDecisionTree } from '../learning/tfDecisionTree';
import * as tf from '@tensorflow/tfjs';

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
    weightsSample: champion.weights.slice(0, 5),
    lastNumbers: lastConcursoNumbers,
    timestamp: new Date().toISOString()
  });

  const predictions: PredictionResult[] = [];
  
  try {
    if (!trainedModel || !trainedModel.layers || trainedModel.layers.length === 0) {
      systemLogger.error('prediction', 'Modelo neural inválido', {
        modelState: trainedModel ? 'exists' : 'null',
        layersCount: trainedModel?.layers?.length
      });
      throw new Error('Modelo neural inválido ou não inicializado');
    }

    // Gerar 8 jogos diferentes
    for (let gameIndex = 0; gameIndex < 8; gameIndex++) {
      systemLogger.log('prediction', `Gerando jogo #${gameIndex + 1}`, {
        championId: champion.id,
        gameIndex,
        timestamp: new Date().toISOString()
      });

      const numbers = new Set<number>();
      const probabilities = new Array(25).fill(0).map((_, i) => ({
        number: i + 1,
        weight: champion.weights[i % champion.weights.length] / 1000
      }));

      // Log dos pesos antes da seleção
      systemLogger.log('prediction', 'Pesos calculados para seleção', {
        gameIndex,
        weightsSample: probabilities.slice(0, 5).map(p => ({
          number: p.number,
          weight: p.weight
        }))
      });

      // Aplicar modelo neural para gerar probabilidades
      const inputTensor = tf.tensor2d([lastConcursoNumbers]);
      const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
      const modelProbs = Array.from(await prediction.data());

      systemLogger.log('prediction', 'Probabilidades do modelo', {
        gameIndex,
        modelProbsSample: modelProbs.slice(0, 5)
      });

      // Combinar probabilidades do modelo com pesos do jogador
      probabilities.forEach((prob, idx) => {
        prob.weight *= (modelProbs[idx % modelProbs.length] + 1);
      });

      // Ordenar por peso e selecionar os 15 números mais prováveis
      const selectedNumbers = probabilities
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);

      systemLogger.log('prediction', `Jogo #${gameIndex + 1} gerado`, {
        numbers: selectedNumbers,
        championId: champion.id,
        timestamp: new Date().toISOString()
      });

      // Calcular estimativa de precisão
      const estimatedAccuracy = (champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length) * 100;
      
      predictions.push({
        numbers: selectedNumbers,
        estimatedAccuracy,
        targetMatches: 11 + gameIndex % 5, // Variando entre 11 e 15
        matchesWithSelected: selectedNumbers.filter(n => lastConcursoNumbers.includes(n)).length,
        isGoodDecision: true
      });

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();
    }

    systemLogger.log('prediction', 'Todos os 8 jogos gerados com sucesso', {
      championId: champion.id,
      totalGames: predictions.length,
      predictions: predictions.map(p => ({
        numbers: p.numbers,
        accuracy: p.estimatedAccuracy
      }))
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração de predições', {
      error: error instanceof Error ? error.message : 'Unknown error',
      championId: champion.id,
      modelState: trainedModel ? 'exists' : 'null'
    });
    throw error;
  }
};