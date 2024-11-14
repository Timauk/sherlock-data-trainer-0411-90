interface WeightConfig {
  sequential: number;
  cyclic: number;
  seasonal: number;
  lunar: number;
}

export class DynamicWeightAdjuster {
  private weights: WeightConfig;
  private readonly learningRate: number = 0.01;
  private readonly minWeight: number = 0.1;
  private readonly maxWeight: number = 0.5;

  constructor() {
    this.weights = {
      sequential: 0.25,
      cyclic: 0.25,
      seasonal: 0.25,
      lunar: 0.25
    };
  }

  adjustWeights(metrics: { accuracy: number, confidence: number }, modelType: keyof WeightConfig): void {
    const adjustment = this.calculateAdjustment(metrics);
    this.weights[modelType] = Math.max(
      this.minWeight,
      Math.min(this.maxWeight, this.weights[modelType] + adjustment)
    );
    
    this.normalizeWeights();
  }

  private calculateAdjustment({ accuracy, confidence }: { accuracy: number, confidence: number }): number {
    return this.learningRate * accuracy * confidence;
  }

  private normalizeWeights(): void {
    const total = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(this.weights).forEach(key => {
      this.weights[key as keyof WeightConfig] /= total;
    });
  }

  getWeights(): WeightConfig {
    return { ...this.weights };
  }
}

export const weightAdjuster = new DynamicWeightAdjuster();