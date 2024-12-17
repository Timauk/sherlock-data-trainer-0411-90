import { Player } from '@/types/gameTypes';
import { systemLogger } from './logging/systemLogger';
import * as tf from '@tensorflow/tfjs';
import { enrichTrainingData } from './features/lotteryFeatureEngineering';
import { calculateReward } from './rewardSystem';

export const validateGameState = (
  players: Player[],
  historicalData: number[][],
  currentIndex: number
) => {
  if (!players || !historicalData) {
    throw new Error('Invalid game state data');
  }

  const validationData = historicalData.slice(Math.max(0, currentIndex - 10), currentIndex);
  return performCrossValidation([players[0].predictions], validationData);
};

export const performCrossValidation = (
  predictions: number[][],
  validationData: number[][],
  folds: number = 10
) => {
  let totalAccuracy = 0;
  const foldSize = Math.floor(validationData.length / folds);

  for (let i = 0; i < folds; i++) {
    const testSet = validationData.slice(i * foldSize, (i + 1) * foldSize);
    const accuracy = calculateAccuracy(predictions, testSet);
    totalAccuracy += accuracy;
  }

  return totalAccuracy / folds;
};

export const calculateAccuracy = (predictions: number[][], actual: number[][]) => {
  let correctPredictions = 0;
  let totalPredictions = 0;

  predictions.forEach((prediction, index) => {
    if (actual[index]) {
      const matches = prediction.filter(num => actual[index].includes(num)).length;
      correctPredictions += matches;
      totalPredictions += prediction.length;
    }
  });

  return totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
};

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
      const logMessage = `Player ${player.id} achieved ${matches} matches!`;
      addLog(logMessage);
      
      if (matches >= 13) {
        showToast?.("Exceptional Performance!", 
          `Player ${player.id} matched ${matches} numbers!`);
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
};

export const initializeGameData = (
  csvData: number[][],
  setNumbers: (numbers: number[][]) => void,
  setBoardNumbers: (numbers: number[]) => void,
  initializePlayers: (count: number) => void,
  players: Player[]
) => {
  if (csvData && csvData.length > 0) {
    setNumbers([csvData[0]]);
    setBoardNumbers(csvData[0]);
    
    if (!players || players.length === 0) {
      initializePlayers(100);
      return true;
    }
  }
  return false;
};

// Game State Manager
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
      
      if (matches >= 13) {
        showToast?.("Desempenho Excepcional!", 
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

// Player Manager
export const initializePlayers = (numPlayers: number = 6): Player[] => {
  systemLogger.log('initialization', 'Iniciando criação dos jogadores', {
    numPlayers,
    timestamp: new Date().toISOString()
  });
  
  const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, index) => {
    const weights = Array.from({ length: 13072 }, () => {
      const baseWeight = Math.floor(Math.random() * 1001);
      return baseWeight;
    });
    
    const player: Player = {
      id: index + 1,
      score: 0,
      predictions: [],
      weights,
      fitness: 0,
      generation: 1,
      modelConnection: {
        lastPrediction: null,
        confidence: 0,
        successRate: 0
      }
    };

    return player;
  });

  systemLogger.log('initialization', 'Jogadores criados com sucesso', {
    totalPlayers: initialPlayers.length,
    championId: initialPlayers[0].id
  });

  return initialPlayers;
};

export const updatePlayers = (
  updatedPlayers: Player[], 
  model: tf.LayersModel | null,
  champion: Player | null,
  setChampion: (player: Player) => void
) => {
  if (!model) {
    systemLogger.error('players', 'Modelo não disponível para atualização dos jogadores');
    return;
  }

  const validPlayers = updatedPlayers.every(player => 
    player.weights && player.weights.length === 13072
  );

  if (!validPlayers) {
    systemLogger.error('players', 'Erro: Jogadores com número incorreto de pesos');
    return;
  }

  const playersWithModelConnection = updatedPlayers.map(player => ({
    ...player,
    modelConnection: {
      ...player.modelConnection,
      lastUpdate: new Date().toISOString()
    }
  }));
  
  const newChampion = playersWithModelConnection.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );
  
  if (!champion || newChampion.score > champion.score) {
    setChampion(newChampion);
    systemLogger.log('player', `Novo campeão: Jogador #${newChampion.id}`, {
      score: newChampion.score,
      fitness: newChampion.fitness
    });
  }

  return playersWithModelConnection;
};