import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { decisionTreeSystem } from '../learning/decisionTree.js';
import { TFDecisionTree } from '../learning/tfDecisionTree';
import { systemLogger } from '../logging/systemLogger';

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
  systemLogger.log('prediction', 'Iniciando geração de previsões detalhada', {
    championId: champion.id,
    championWeights: champion.weights,
    lastNumbers: lastConcursoNumbers,
    modelStatus: trainedModel ? 'loaded' : 'not loaded',
    timestamp: new Date().toISOString()
  });

  const predictions: PredictionResult[] = [];
  
  try {
    // Verificar estado do modelo
    if (!trainedModel || !trainedModel.layers || trainedModel.layers.length === 0) {
      systemLogger.log('error', 'Modelo neural inválido', {
        modelState: trainedModel ? 'exists' : 'null',
        layersCount: trainedModel?.layers?.length
      });
      throw new Error('Modelo neural inválido ou não inicializado');
    }

    // Gerar números baseados nos pesos do campeão
    const generateNumbersWithWeights = () => {
      const numbers = new Set<number>();
      const probabilities = new Array(25).fill(0).map((_, i) => ({
        number: i + 1,
        weight: champion.weights[i % champion.weights.length]
      }));

      // Ordenar por peso e selecionar os 15 números mais prováveis
      const selectedNumbers = probabilities
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);

      systemLogger.log('prediction', 'Números gerados com pesos', {
        championId: champion.id,
        selectedNumbers,
        weightsUsed: champion.weights
      });

      return selectedNumbers;
    };

    // Gerar múltiplas predições com diferentes alvos
    const targets = [11, 12, 13, 14, 15];
    for (const targetMatches of targets) {
      const numbers = generateNumbersWithWeights();
      
      // Calcular estimativa de precisão baseada nos pesos
      const estimatedAccuracy = (champion.weights.reduce((a, b) => a + b, 0) / champion.weights.length) * 100;
      
      const matchesWithSelected = selectedNumbers.filter(n => numbers.includes(n)).length;
      
      // Validar decisão usando árvores de decisão
      const classicDecision = decisionTreeSystem.predict(numbers, 'Crescente');
      const tfDecision = tfDecisionTreeInstance.predict(numbers);
      
      predictions.push({
        numbers,
        estimatedAccuracy,
        targetMatches,
        matchesWithSelected,
        isGoodDecision: classicDecision && tfDecision
      });

      systemLogger.log('prediction', 'Predição gerada', {
        championId: champion.id,
        numbers,
        accuracy: estimatedAccuracy,
        target: targetMatches,
        matches: matchesWithSelected
      });
    }

    return predictions;
  } catch (error) {
    systemLogger.log('error', 'Erro na geração de predições', {
      error: error instanceof Error ? error.message : 'Unknown error',
      championId: champion.id,
      modelState: trainedModel ? 'exists' : 'null'
    });
    throw error;
  }
};