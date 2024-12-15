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

    // Debug do modelo
    systemLogger.log('model', 'Estado do modelo antes das previsões', {
      layers: trainedModel.layers.length,
      inputShape: trainedModel.inputs[0].shape,
      outputShape: trainedModel.outputs[0].shape,
      compiled: !!trainedModel.optimizer
    });

    // Gerar 8 jogos diferentes
    for (let gameIndex = 0; gameIndex < 8; gameIndex++) {
      systemLogger.log('prediction', `Iniciando geração do jogo #${gameIndex + 1}`, {
        championId: champion.id,
        gameIndex,
        timestamp: new Date().toISOString()
      });

      const numbers = new Set<number>();
      const probabilities = new Array(25).fill(0).map((_, i) => ({
        number: i + 1,
        weight: champion.weights[i % champion.weights.length] / 1000
      }));

      // Log detalhado dos pesos antes da seleção
      systemLogger.log('weights', `Pesos do jogador para jogo #${gameIndex + 1}`, {
        gameIndex,
        weightsSample: probabilities.slice(0, 5),
        weightsStats: {
          min: Math.min(...champion.weights),
          max: Math.max(...champion.weights),
          avg: champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length
        }
      });

      // Aplicar modelo neural para gerar probabilidades
      const inputTensor = tf.tensor2d([lastConcursoNumbers]);
      const prediction = await trainedModel.predict(inputTensor) as tf.Tensor;
      const modelProbs = Array.from(await prediction.data());

      systemLogger.log('model', `Probabilidades do modelo para jogo #${gameIndex + 1}`, {
        gameIndex,
        modelProbsSample: modelProbs.slice(0, 5),
        modelProbsStats: {
          min: Math.min(...modelProbs),
          max: Math.max(...modelProbs),
          avg: modelProbs.reduce((a, b) => a + b, 0) / modelProbs.length
        }
      });

      // Combinar probabilidades do modelo com pesos do jogador
      probabilities.forEach((prob, idx) => {
        const originalWeight = prob.weight;
        prob.weight *= (modelProbs[idx % modelProbs.length] + 1);
        
        systemLogger.log('weights', `Peso combinado para número ${prob.number}`, {
          number: prob.number,
          originalWeight,
          modelProb: modelProbs[idx % modelProbs.length],
          finalWeight: prob.weight
        });
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
        weightsUsed: true,
        timestamp: new Date().toISOString(),
        probabilitiesUsed: probabilities.slice(0, 15).map(p => ({
          number: p.number,
          finalWeight: p.weight
        }))
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

    systemLogger.log('prediction', 'Resumo da geração de jogos', {
      championId: champion.id,
      totalGames: predictions.length,
      predictions: predictions.map(p => ({
        numbers: p.numbers,
        accuracy: p.estimatedAccuracy,
        matches: p.matchesWithSelected
      })),
      memoryInfo: tf.memory()
    });

    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro na geração de predições', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      championId: champion.id,
      modelState: trainedModel ? 'exists' : 'null',
      memoryInfo: tf.memory()
    });
    throw error;
  }
};