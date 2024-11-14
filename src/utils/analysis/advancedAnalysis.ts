import { systemLogger } from '../logging/systemLogger';
import { TimeSeriesAnalysis } from './timeSeriesAnalysis';
import { analyzeLunarPatterns } from '../lunarCalculations';

interface AnalysisResult {
  patterns: {
    sequential: number[];
    cyclic: number[];
    seasonal: number[];
  };
  predictions: {
    nextDraw: number[];
    confidence: number;
  };
  metrics: {
    accuracy: number;
    reliability: number;
    coverage: number;
  };
}

export class AdvancedAnalysisSystem {
  private static instance: AdvancedAnalysisSystem;
  private timeSeriesAnalyzer: TimeSeriesAnalysis;
  private historicalData: number[][];
  private dates: Date[];

  private constructor() {
    this.historicalData = [];
    this.dates = [];
    this.timeSeriesAnalyzer = new TimeSeriesAnalysis([]);
  }

  static getInstance(): AdvancedAnalysisSystem {
    if (!AdvancedAnalysisSystem.instance) {
      AdvancedAnalysisSystem.instance = new AdvancedAnalysisSystem();
    }
    return AdvancedAnalysisSystem.instance;
  }

  updateData(numbers: number[][], dates: Date[]): void {
    this.historicalData = numbers;
    this.dates = dates;
    this.timeSeriesAnalyzer = new TimeSeriesAnalysis(numbers);
  }

  async analyze(): Promise<AnalysisResult> {
    const sequentialPatterns = this.analyzeSequentialPatterns();
    const cyclicPatterns = this.analyzeCyclicPatterns();
    const seasonalPatterns = this.analyzeSeasonalPatterns();
    
    const timeSeriesPrediction = this.timeSeriesAnalyzer.analyzeNumbers();
    const lunarPatterns = analyzeLunarPatterns(this.dates, this.historicalData);
    
    const combinedPrediction = this.combinePredictions(
      timeSeriesPrediction,
      lunarPatterns,
      sequentialPatterns
    );

    const metrics = this.calculateMetrics();

    return {
      patterns: {
        sequential: sequentialPatterns,
        cyclic: cyclicPatterns,
        seasonal: seasonalPatterns
      },
      predictions: {
        nextDraw: combinedPrediction.numbers,
        confidence: combinedPrediction.confidence
      },
      metrics
    };
  }

  private analyzeSequentialPatterns(): number[] {
    const patterns: number[] = [];
    this.historicalData.forEach(draw => {
      for (let i = 0; i < draw.length - 2; i++) {
        if (draw[i + 1] === draw[i] + 1 && draw[i + 2] === draw[i] + 2) {
          patterns.push(draw[i]);
        }
      }
    });
    return patterns;
  }

  private analyzeCyclicPatterns(): number[] {
    const frequencyMap = new Map<number, number>();
    this.historicalData.forEach(draw => {
      draw.forEach(num => {
        frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
      });
    });
    
    return Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)
      .slice(0, 15);
  }

  private analyzeSeasonalPatterns(): number[] {
    const monthlyPatterns = new Array(12).fill(0).map(() => new Map<number, number>());
    
    this.dates.forEach((date, idx) => {
      const month = date.getMonth();
      this.historicalData[idx].forEach(num => {
        monthlyPatterns[month].set(
          num,
          (monthlyPatterns[month].get(num) || 0) + 1
        );
      });
    });

    const currentMonth = new Date().getMonth();
    return Array.from(monthlyPatterns[currentMonth].entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)
      .slice(0, 15);
  }

  private combinePredictions(
    timeSeriesPred: number[],
    lunarPatterns: any,
    sequentialPatterns: number[]
  ): { numbers: number[], confidence: number } {
    const weightedNumbers = new Map<number, number>();
    
    // Combina as diferentes previsões com pesos
    timeSeriesPred.forEach(num => {
      weightedNumbers.set(num, (weightedNumbers.get(num) || 0) + 0.4);
    });
    
    Object.entries(lunarPatterns).forEach(([num, weight]) => {
      weightedNumbers.set(Number(num), (weightedNumbers.get(Number(num)) || 0) + 0.3 * Number(weight));
    });
    
    sequentialPatterns.forEach(num => {
      weightedNumbers.set(num, (weightedNumbers.get(num) || 0) + 0.3);
    });

    // Seleciona os 15 números com maiores pesos
    const sortedNumbers = Array.from(weightedNumbers.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    const numbers = sortedNumbers.map(([num]) => num);
    const confidence = sortedNumbers.reduce((acc, [, weight]) => acc + weight, 0) / 15;

    return { numbers, confidence };
  }

  private calculateMetrics(): { accuracy: number; reliability: number; coverage: number } {
    return {
      accuracy: 0.75, // Placeholder - implementar cálculo real
      reliability: 0.8, // Placeholder - implementar cálculo real
      coverage: 0.9 // Placeholder - implementar cálculo real
    };
  }
}

export const advancedAnalysis = AdvancedAnalysisSystem.getInstance();