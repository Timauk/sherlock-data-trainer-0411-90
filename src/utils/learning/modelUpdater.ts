import * as tf from '@tensorflow/tfjs';

export class ModelUpdater {
  async updateModel(
    model: tf.LayersModel,
    prediction: number[],
    actual: number[],
    patterns: any[],
    reward: number
  ): Promise<void> {
    const learningRate = 0.001 * Math.abs(reward) * this.calculatePatternDepth(patterns);
    const optimizer = tf.train.adam(learningRate);
    
    model.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    const enrichedData = this.enrichDataWithPatterns(prediction, patterns);
    const xs = tf.tensor2d([enrichedData]);
    const ys = tf.tensor2d([actual]);

    await model.trainOnBatch(xs, ys);

    xs.dispose();
    ys.dispose();
  }

  private calculatePatternDepth(patterns: any[]): number {
    return patterns.reduce((depth, pattern) => (
      Math.max(depth, pattern.confidence)
    ), 0);
  }

  private enrichDataWithPatterns(prediction: number[], patterns: any[]): number[] {
    const patternFeatures = patterns.map(p => p.confidence * this.calculatePatternDepth([p]));
    return [...prediction, ...patternFeatures];
  }
}