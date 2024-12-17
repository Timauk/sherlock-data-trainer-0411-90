import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import * as tf from '@tensorflow/tfjs';
import { Player } from './types';
import { systemLogger } from './logger';

export const calculateReward = (matches: number): number => {
  switch (matches) {
    case 15: return 1000000;
    case 14: return 100000;
    case 13: return 10000;
    case 12: return 1000;
    case 11: return 100;
    default: return 0;
  }
};

export const createOffspring = (parent1: Player, parent2: Player, generation: number): Player => {
  const childWeights = parent1.weights.map((weight, index) => {
    const parentFitness1 = parent1.fitness || 0.1;
    const parentFitness2 = parent2.fitness || 0.1;
    const totalFitness = parentFitness1 + parentFitness2;
    
    const weight1Contribution = (parentFitness1 / totalFitness) * weight;
    const weight2Contribution = (parentFitness2 / totalFitness) * parent2.weights[index];
    
    return weight1Contribution + weight2Contribution;
  });

  const mutationRate = 0.1 * Math.exp(generation / 100);
  const mutatedWeights = childWeights.map(weight => {
    return Math.random() < mutationRate 
      ? weight + (Math.random() - 0.5) * 0.01
      : weight;
  });

  return {
    id: Math.random(),
    score: 0,
    predictions: [],
    weights: mutatedWeights,
    fitness: 0,
    generation: generation + 1,
    modelConnection: {
      lastPrediction: null,
      confidence: 0,
      successRate: 0
    }
  };
};

export const initTensorFlow = async (): Promise<boolean> => {
  try {
    await tf.ready();
    systemLogger.log('system', 'TensorFlow.js initialized successfully');
    return true;
  } catch (error) {
    systemLogger.error('system', 'Failed to initialize TensorFlow.js:', { error });
    return false;
  }
};

export const predictNumbers = async (
  trainedModel: tf.LayersModel,
  inputData: number[]
): Promise<tf.Tensor> => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  inputTensor.dispose();
  return predictions;
};

export const validateModelArchitecture = async (model: tf.LayersModel): Promise<boolean> => {
  try {
    if (!model || !model.layers || model.layers.length === 0) {
      systemLogger.error('model', 'Modelo inválido ou sem camadas');
      return false;
    }

    if (!model.optimizer) {
      systemLogger.warn('model', 'Modelo não compilado, compilando agora...');
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
    }

    const inputShape = model.inputs[0].shape[1];
    const testTensor = tf.zeros([1, inputShape]);
    
    try {
      const testPred = model.predict(testTensor) as tf.Tensor;
      const testResult = await testPred.data();
      
      if (!testResult || testResult.length === 0) {
        throw new Error('Predição de teste falhou');
      }
      
      testPred.dispose();
      testTensor.dispose();
      
      return true;
    } catch (error) {
      systemLogger.error('model', 'Teste de predição falhou', { error });
      return false;
    }
  } catch (error) {
    systemLogger.error('model', 'Validação do modelo falhou', { error });
    return false;
  }
};
