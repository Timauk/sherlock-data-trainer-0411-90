import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  earlyStoppingPatience: number;
}

interface PredictionConfig {
  lunarPhase: string;
  patterns: Record<string, number[]>;
}

export function createModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 64, inputShape: [null, 17], returnSequences: true }));
  model.add(tf.layers.lstm({ units: 32 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  data: number[][],
  config: TrainingConfig
): Promise<tf.History> {
  const xs = tf.tensor3d(data.map(row => [row.slice(0, 17)]));
  const ys = tf.tensor2d(data.map(row => row.slice(17)));

  const history = await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: config.earlyStoppingPatience })
  });

  xs.dispose();
  ys.dispose();

  return history;
}

export async function makePrediction(
  model: tf.LayersModel | null,
  inputData: number[],
  weights: number[],
  config: PredictionConfig
): Promise<number[]> {
  if (!model) return [];
  
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = model.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await predictions.data());
  
  inputTensor.dispose();
  predictions.dispose();
  
  // Apply weights and configuration
  return result.map((n, i) => Math.round(n * weights[i % weights.length]));
}

export function normalizeData(data: number[][]): number[][] {
  const maxValue = 25;
  return data.map(row => row.map(n => n / maxValue));
}

export function denormalizeData(data: number[][]): number[][] {
  const maxValue = 25;
  return data.map(row => row.map(n => Math.round(n * maxValue)));
}

export function addDerivedFeatures(data: number[][]): number[][] {
  const frequencyMap = new Map<number, number>();
  data.forEach(row => {
    row.forEach(n => {
      frequencyMap.set(n, (frequencyMap.get(n) || 0) + 1);
    });
  });

  return data.map(row => {
    const frequencies = row.map(n => frequencyMap.get(n) || 0);
    return [...row, ...frequencies];
  });
}

export async function updateModel(
  model: tf.LayersModel,
  newData: number[][],
  config: { epochs: number }
): Promise<tf.LayersModel> {
  const xs = tf.tensor2d(newData.map(row => row.slice(0, -15)));
  const ys = tf.tensor2d(newData.map(row => row.slice(-15)));

  await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: 32,
  });

  xs.dispose();
  ys.dispose();

  return model;
}
