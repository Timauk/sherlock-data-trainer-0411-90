import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { generateCorePredictions } from './predictionCore';
import { PredictionResult } from '../types';
import { extractFeatures } from '@/utils/features/featureEngineering';

export const generatePredictions = async (
  champion: Player,
  trainedModel: tf.LayersModel,
  lastConcursoNumbers: number[],
  selectedNumbers: number[]
): Promise<PredictionResult[]> => {
  try {
    systemLogger.log('prediction', 'Iniciando geração de predições', {
      hasChampion: !!champion,
      hasModel: !!trainedModel,
      inputNumbers: lastConcursoNumbers
    });

    // Garantir que temos os 15 números do último concurso
    if (!lastConcursoNumbers || lastConcursoNumbers.length === 0) {
      throw new Error('Números do último concurso não disponíveis');
    }

    // Gerar predições base com features enriquecidas
    const probabilities = await generateCorePredictions(trainedModel, lastConcursoNumbers);
    
    // Aplicar pesos do campeão
    const weightedPredictions = probabilities.map((prob, index) => ({
      number: index + 1,
      probability: prob * (champion?.weights?.[index % (champion?.weights?.length || 1)] || 1)
    }));

    // Selecionar os 15 números mais prováveis
    const predictions = weightedPredictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15)
      .map(p => p.number)
      .sort((a, b) => a - b);

    const matches = selectedNumbers.length > 0 
      ? predictions.filter(n => selectedNumbers.includes(n)).length 
      : 0;

    return [{
      numbers: predictions,
      estimatedAccuracy: 0.75,
      targetMatches: 15,
      matchesWithSelected: matches,
      isGoodDecision: matches >= 8
    }];
  } catch (error) {
    systemLogger.error('prediction', 'Erro ao gerar predições', { error });
    throw error;
  }
};

export const generateDirectPredictions = async (
  model: tf.LayersModel,
  lastNumbers: number[]
): Promise<number[][]> => {
  try {
    const predictions: number[][] = [];
    const currentDate = new Date();
    const historicalData = [lastNumbers];
    
    for (let i = 0; i < 10; i++) {
      const features = extractFeatures(lastNumbers, currentDate, historicalData);
      const enrichedInput = [
        ...features.baseFeatures,
        ...features.temporalFeatures,
        ...features.lunarFeatures,
        ...features.statisticalFeatures
      ];
      
      const inputTensor = tf.tensor2d([enrichedInput]);
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const probabilities = Array.from(await prediction.data());
      
      const numbers = probabilities
        .map((prob, index) => ({ number: index + 1, probability: prob }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 15)
        .map(p => p.number)
        .sort((a, b) => a - b);
      
      predictions.push(numbers);
      
      inputTensor.dispose();
      prediction.dispose();
    }
    
    return predictions;
  } catch (error) {
    systemLogger.error('prediction', 'Erro nas predições diretas', { error });
    throw error;
  }
};