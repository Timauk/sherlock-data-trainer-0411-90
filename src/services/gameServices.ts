import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { calculateReward } from '@/utils/rewardSystem';

// Game Logic Service
export const GameLogicService = {
  createSharedModel: async () => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }));
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    return model;
  },

  predictNumbers: async (model: tf.Sequential, input: number[]): Promise<number[]> => {
    const inputTensor = tf.tensor2d([input]);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = Array.from(await prediction.data());
    inputTensor.dispose();
    prediction.dispose();
    return result.map(n => Math.round(n * 24) + 1);
  },

  processCSV: (text: string): number[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => 
      line.split(',').map(Number).filter((_, index) => index > 1 && index <= 16)
    );
  },

  trainModel: async (model: tf.Sequential, data: number[][]) => {
    const xs = tf.tensor2d(data.map(row => row.slice(0, 15)));
    const ys = tf.tensor2d(data.map(row => row.slice(15)));
    
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      shuffle: true,
      validationSplit: 0.2,
    });

    xs.dispose();
    ys.dispose();
    return model;
  }
};

// Game Updates Service
export const GameUpdateService = {
  updatePlayerStates: (
    players: Player[],
    predictions: number[][],
    currentBoardNumbers: number[],
    nextConcurso: number,
    addLog: (message: string) => void,
    showToast?: (title: string, description: string) => void
  ) => {
    let totalMatches = 0;
    let randomMatches = 0;
    let currentGameMatches = 0;
    let currentGameRandomMatches = 0;
    const totalPredictions = players.length * (nextConcurso + 1);

    const updatedPlayers = players.map((player, index) => {
      const playerPredictions = predictions[index];
      const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      
      totalMatches += matches;
      currentGameMatches += matches;
      
      const randomPrediction = Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
      const randomMatch = randomPrediction.filter(num => currentBoardNumbers.includes(num)).length;
      randomMatches += randomMatch;
      currentGameRandomMatches += randomMatch;

      const reward = calculateReward(matches);
      
      if (matches >= 11) {
        const logMessage = `Jogador ${player.id} acertou ${matches} números!`;
        addLog(logMessage);
        
        if (matches >= 13 && showToast) {
          showToast("Desempenho Excepcional!", 
            `Jogador ${player.id} acertou ${matches} números!`);
        }
      }

      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions,
        fitness: matches
      };
    });

    return {
      updatedPlayers,
      metrics: {
        totalMatches,
        randomMatches,
        currentGameMatches,
        currentGameRandomMatches,
        totalPredictions
      }
    };
  }
};

// Lunar Analysis Service
export const LunarAnalysisService = {
  analyzeLunarPhase: (date: Date) => {
    const lunarCycle = 29.53059; // Length of lunar cycle in days
    const baseDate = new Date("2000-01-06"); // Known new moon date
    const timeDiff = date.getTime() - baseDate.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    const phase = (daysDiff % lunarCycle) / lunarCycle;

    if (phase < 0.125) return "New Moon";
    if (phase < 0.25) return "Waxing Crescent";
    if (phase < 0.375) return "First Quarter";
    if (phase < 0.5) return "Waxing Gibbous";
    if (phase < 0.625) return "Full Moon";
    if (phase < 0.75) return "Waning Gibbous";
    if (phase < 0.875) return "Last Quarter";
    return "Waning Crescent";
  },

  analyzeLunarPatterns: (dates: Date[], numbers: number[][]) => {
    const patterns: { [key: string]: { count: number, numbers: number[] } } = {};
    
    dates.forEach((date, index) => {
      const phase = LunarAnalysisService.analyzeLunarPhase(date);
      if (!patterns[phase]) {
        patterns[phase] = { count: 0, numbers: [] };
      }
      patterns[phase].count++;
      patterns[phase].numbers.push(...numbers[index]);
    });

    // Calculate frequency of numbers in each phase
    Object.keys(patterns).forEach(phase => {
      const numberFrequency = new Array(25).fill(0);
      patterns[phase].numbers.forEach(num => {
        if (num >= 1 && num <= 25) {
          numberFrequency[num - 1]++;
        }
      });
      patterns[phase].numbers = numberFrequency;
    });

    return patterns;
  },

  getLunarPrediction: (currentPhase: string, patterns: any) => {
    if (!patterns[currentPhase]) return [];

    const phaseNumbers = patterns[currentPhase].numbers;
    const sortedIndices = phaseNumbers
      .map((count: number, index: number) => ({ count, number: index + 1 }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 15)
      .map(item => item.number);

    return sortedIndices;
  }
};