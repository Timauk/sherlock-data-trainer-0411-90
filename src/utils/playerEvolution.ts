import { Player } from '../types/gameTypes';
import * as tf from '@tensorflow/tfjs';

export const cloneChampion = (champion: Player, totalPlayers: number): Player[] => {
  const clones: Player[] = [];
  
  // Mantém o campeão original
  clones.push({...champion});
  
  // Cria clones com 50% de variação nos pesos
  for (let i = 1; i < totalPlayers; i++) {
    const modifiedWeights = champion.weights.map(weight => {
      const variation = (Math.random() - 0.5) * weight;
      return weight + variation;
    });
    
    clones.push({
      id: Math.random(),
      score: 0,
      predictions: [],
      weights: modifiedWeights,
      fitness: 0,
      generation: champion.generation + 1
    });
  }
  
  return clones;
};

export const updateModelWithChampionKnowledge = async (
  model: tf.LayersModel,
  champion: Player,
  trainingData: number[][]
): Promise<tf.LayersModel> => {
  // Prepara os dados de treinamento do campeão
  const xs = tf.tensor2d(trainingData.map(d => d.slice(0, -15)));
  const ys = tf.tensor2d(trainingData.map(d => d.slice(-15)));

  // Aplica os pesos do campeão como bias inicial
  const championLayer = tf.layers.dense({
    units: 15,
    weights: [tf.tensor2d([champion.weights]), tf.zeros([15])]
  });

  // Adiciona a camada do campeão ao modelo
  const updatedModel = tf.sequential();
  model.layers.forEach(layer => updatedModel.add(layer));
  updatedModel.add(championLayer);

  // Treina o modelo com os dados do campeão
  await updatedModel.fit(xs, ys, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2
  });

  xs.dispose();
  ys.dispose();

  return updatedModel;
};