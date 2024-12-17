import * as tf from '@tensorflow/tfjs';
import { Player } from '@/types/gameTypes';
import { systemLogger } from '@/utils/logging/systemLogger';
import { calculateReward } from '@/utils/rewardSystem';

let sharedModel: tf.Sequential | null = null;

export async function createSharedModel() {
  if (!sharedModel) {
    sharedModel = tf.sequential();
    sharedModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }));
    sharedModel.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    sharedModel.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    sharedModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  }
  return sharedModel;
}

export const updatePlayerStates = (
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

  systemLogger.log('game', 'Iniciando comparação de números', {
    currentBoardNumbers,
    totalPlayers: players.length,
    timestamp: new Date().toISOString()
  });

  const updatedPlayers = players.map((player, index) => {
    const playerPredictions = predictions[index];
    const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
    
    systemLogger.log('game', `Comparação do Jogador #${player.id}`, {
      playerPredictions,
      currentBoardNumbers,
      matches,
      timestamp: new Date().toISOString()
    });

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

    const updatedPlayer = {
      ...player,
      score: player.score + reward,
      predictions: playerPredictions,
      fitness: matches
    };

    systemLogger.log('game', `Atualização do Jogador #${player.id}`, {
      previousScore: player.score,
      newScore: updatedPlayer.score,
      reward,
      matches,
      timestamp: new Date().toISOString()
    });

    return updatedPlayer;
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
};

export async function predictNumbers(input: number[]): Promise<number[]> {
  if (!sharedModel) await createSharedModel();
  const inputTensor = tf.tensor2d([input]);
  const prediction = sharedModel!.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await prediction.data());
  inputTensor.dispose();
  prediction.dispose();
  return result.map(n => Math.round(n * 24) + 1);
}

export function processCSV(text: string): number[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => 
    line.split(',').map(Number).filter((_, index) => index > 1 && index <= 16)
  );
}

export async function trainModel(data: number[][]) {
  const model = await createSharedModel();
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
