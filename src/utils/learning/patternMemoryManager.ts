export class PatternMemoryManager {
  private patternMemory: Map<string, number> = new Map();

  memorizePatterns(patterns: any[]): void {
    patterns.forEach(pattern => {
      const patternKey = `${pattern.type}-${pattern.data.join(',')}`;
      const currentCount = this.patternMemory.get(patternKey) || 0;
      this.patternMemory.set(patternKey, currentCount + 1);
    });
  }

  calculatePatternDepth(patterns: any[]): number {
    return patterns.reduce((depth, pattern) => {
      const frequency = this.patternMemory.get(`${pattern.type}-${pattern.data.join(',')}`) || 0;
      return Math.max(depth, pattern.confidence * (1 + Math.log(frequency + 1)));
    }, 0);
  }
}