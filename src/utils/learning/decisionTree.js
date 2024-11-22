class DecisionTreeSystem {
  constructor() {
    this.decisions = [];
    this.patterns = new Map();
  }

  addPlayerDecision(player, numbers, matches, lunarPhase) {
    this.decisions.push({
      playerId: player.id,
      numbers,
      matches,
      lunarPhase,
      timestamp: Date.now()
    });

    // Atualiza padrões conhecidos
    const pattern = this.extractPattern(numbers);
    this.updatePatterns(pattern, matches >= 11);
  }

  predict(numbers, lunarPhase) {
    if (this.decisions.length < 10) {
      return true; // Poucos dados para decisão confiável
    }

    const pattern = this.extractPattern(numbers);
    const success = this.patterns.get(pattern)?.successRate || 0.5;

    return success > 0.5;
  }

  extractPattern(numbers) {
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return `${evenCount}-${Math.floor(sum/numbers.length)}`;
  }

  updatePatterns(pattern, success) {
    if (!this.patterns.has(pattern)) {
      this.patterns.set(pattern, { total: 0, success: 0 });
    }
    
    const stats = this.patterns.get(pattern);
    stats.total++;
    if (success) stats.success++;
    stats.successRate = stats.success / stats.total;
  }

  getInsights() {
    const insights = [];
    
    if (this.decisions.length > 0) {
      const totalSuccess = this.decisions.filter(d => d.matches >= 11).length;
      insights.push(`Taxa de sucesso geral: ${((totalSuccess/this.decisions.length) * 100).toFixed(1)}%`);
    }

    return insights;
  }
}

export const decisionTreeSystem = new DecisionTreeSystem();