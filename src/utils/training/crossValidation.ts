import * as tf from '@tensorflow/tfjs';
import { systemLogger } from '../logging/systemLogger';

export const performCrossValidation = async (
  model: tf.LayersModel,
  features: number[][],
  labels: number[][],
  folds: number = 5
) => {
  const foldSize = Math.floor(features.length / folds);
  const metrics: { accuracy: number; loss: number }[] = [];

  for (let i = 0; i < folds; i++) {
    const validationStart = i * foldSize;
    const validationEnd = validationStart + foldSize;

    const trainFeatures = [
      ...features.slice(0, validationStart),
      ...features.slice(validationEnd)
    ];
    const trainLabels = [
      ...labels.slice(0, validationStart),
      ...labels.slice(validationEnd)
    ];

    const validationFeatures = features.slice(validationStart, validationEnd);
    const validationLabels = labels.slice(validationStart, validationEnd);

    const result = await model.evaluate(
      tf.tensor2d(validationFeatures),
      tf.tensor2d(validationLabels),
      { batchSize: 32 }
    ) as tf.Scalar[];

    metrics.push({
      loss: result[0].dataSync()[0],
      accuracy: result[1].dataSync()[0]
    });
  }

  return metrics;
};