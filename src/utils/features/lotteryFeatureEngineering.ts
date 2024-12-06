import * as tf from '@tensorflow/tfjs';

interface LotteryFeatures {
  frequencyFeatures: number[];
  sequenceFeatures: number[];
  temporalFeatures: number[];
  statisticalFeatures: number[];
  correlationFeatures: number[];
}

export const extractFeatures = (
  numbers: number[][],
  dates: Date[]
): LotteryFeatures => {
  return {
    frequencyFeatures: calculateFrequencyFeatures(numbers),
    sequenceFeatures: calculateSequenceFeatures(numbers),
    temporalFeatures: calculateTemporalFeatures(numbers, dates),
    statisticalFeatures: calculateStatisticalFeatures(numbers),
    correlationFeatures: calculateCorrelationFeatures(numbers)
  };
};

const calculateFrequencyFeatures = (numbers: number[][]): number[] => {
  const frequency: { [key: number]: number } = {};
  const totalGames = numbers.length;

  // Contagem de frequência absoluta
  numbers.flat().forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });

  // Normalização das frequências
  return Array.from({ length: 25 }, (_, i) => {
    const num = i + 1;
    return (frequency[num] || 0) / totalGames;
  });
};

const calculateSequenceFeatures = (numbers: number[][]): number[] => {
  const features: number[] = [];
  
  // Análise de números consecutivos
  let consecutiveCount = 0;
  numbers.forEach(game => {
    for (let i = 1; i < game.length; i++) {
      if (game[i] === game[i-1] + 1) consecutiveCount++;
    }
  });
  features.push(consecutiveCount / numbers.length);

  // Proporção par/ímpar
  const evenOddRatio = numbers.reduce((acc, game) => {
    const evenCount = game.filter(n => n % 2 === 0).length;
    return acc + (evenCount / game.length);
  }, 0) / numbers.length;
  features.push(evenOddRatio);

  // Distribuição por quartis
  const quartileDistribution = numbers.reduce((acc, game) => {
    const q1 = game.filter(n => n <= 6).length;
    const q2 = game.filter(n => n > 6 && n <= 12).length;
    const q3 = game.filter(n => n > 12 && n <= 18).length;
    const q4 = game.filter(n => n > 18).length;
    return [
      acc[0] + q1,
      acc[1] + q2,
      acc[2] + q3,
      acc[3] + q4
    ];
  }, [0, 0, 0, 0]).map(count => count / (numbers.length * 15));
  
  features.push(...quartileDistribution);

  return features;
};

const calculateTemporalFeatures = (numbers: number[][], dates: Date[]): number[] => {
  const features: number[] = [];
  
  // Análise de sazonalidade
  const monthlyDistribution = Array(12).fill(0);
  const weekdayDistribution = Array(7).fill(0);
  
  dates.forEach((date, idx) => {
    monthlyDistribution[date.getMonth()]++;
    weekdayDistribution[date.getDay()]++;
    
    // Adiciona os números sorteados à distribuição
    numbers[idx].forEach(() => {
      monthlyDistribution[date.getMonth()]++;
      weekdayDistribution[date.getDay()]++;
    });
  });

  // Normalização
  features.push(
    ...monthlyDistribution.map(count => count / dates.length),
    ...weekdayDistribution.map(count => count / dates.length)
  );

  return features;
};

const calculateStatisticalFeatures = (numbers: number[][]): number[] => {
  const features: number[] = [];
  
  // Média e desvio padrão dos números
  numbers.forEach(game => {
    const mean = game.reduce((a, b) => a + b, 0) / game.length;
    const variance = game.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / game.length;
    features.push(mean / 25, Math.sqrt(variance) / 25);
  });

  // Range dos números
  const ranges = numbers.map(game => {
    const max = Math.max(...game);
    const min = Math.min(...game);
    return (max - min) / 25;
  });
  features.push(...ranges);

  return features;
};

const calculateCorrelationFeatures = (numbers: number[][]): number[] => {
  const features: number[] = [];
  const cooccurrenceMatrix: number[][] = Array(25).fill(0).map(() => Array(25).fill(0));
  
  // Matriz de coocorrência
  numbers.forEach(game => {
    game.forEach((num1, i) => {
      game.forEach((num2, j) => {
        if (i !== j) {
          cooccurrenceMatrix[num1-1][num2-1]++;
        }
      });
    });
  });

  // Extração de características da matriz
  for (let i = 0; i < 25; i++) {
    const rowSum = cooccurrenceMatrix[i].reduce((a, b) => a + b, 0);
    features.push(rowSum / (numbers.length * 14)); // 14 porque excluímos a diagonal
  }

  return features;
};

export const enrichTrainingData = (
  numbers: number[][],
  dates: Date[]
): number[][] => {
  const features = extractFeatures(numbers, dates);
  
  // Combina todas as características
  const enrichedFeatures = [
    ...features.frequencyFeatures,
    ...features.sequenceFeatures,
    ...features.temporalFeatures,
    ...features.statisticalFeatures,
    ...features.correlationFeatures
  ];

  // Normaliza todas as características para o intervalo [0, 1]
  const normalizedFeatures = enrichedFeatures.map(f => 
    Math.max(0, Math.min(1, f))
  );

  console.log('Características enriquecidas geradas:', {
    totalFeatures: normalizedFeatures.length,
    frequencyFeatures: features.frequencyFeatures.length,
    sequenceFeatures: features.sequenceFeatures.length,
    temporalFeatures: features.temporalFeatures.length,
    statisticalFeatures: features.statisticalFeatures.length,
    correlationFeatures: features.correlationFeatures.length
  });

  // Retorna os dados originais enriquecidos com as novas características
  return numbers.map(game => [...game, ...normalizedFeatures]);
};