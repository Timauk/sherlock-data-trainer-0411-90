import { systemLogger } from './logging/systemLogger';

export const calculateReward = (matches: number): number => {
  systemLogger.log('reward', 'Calculando recompensa', {
    matches,
    timestamp: new Date().toISOString()
  });

  // Sistema de recompensa baseado no número de acertos
  let reward = 0;
  
  if (matches === 15) {
    reward = 32;
  } else if (matches === 14) {
    reward = 16;
  } else if (matches === 13) {
    reward = 8;
  } else if (matches === 12) {
    reward = 4;
  } else if (matches === 11) {
    reward = 2;
  } else if (matches === 10) {
    reward = -2;
  } else if (matches === 9) {
    reward = -4;
  } else if (matches === 8) {
    reward = -8;
  } else if (matches === 7) {
    reward = -16;
  } else if (matches < 7) {
    reward = -32; // Penalização máxima para menos de 7 acertos
  }

  systemLogger.log('reward', `Recompensa calculada para ${matches} acertos`, {
    matches,
    reward,
    formula: 'Tabela fixa de pontuação',
    timestamp: new Date().toISOString()
  });

  return reward;
};

export const logReward = (matches: number, playerId: number): string => {
  const reward = calculateReward(matches);
  let message = '';

  if (reward > 0) {
    message = `[Jogador #${playerId}] Premiação: +${reward} pontos por acertar ${matches} números!`;
  } else if (reward < 0) {
    message = `[Jogador #${playerId}] Penalidade: ${reward} pontos por acertar ${matches} números.`;
  } else {
    message = `[Jogador #${playerId}] Sem pontuação: ${matches} acertos.`;
  }

  systemLogger.log('reward', message, {
    playerId,
    matches,
    reward,
    timestamp: new Date().toISOString()
  });

  return message;
};