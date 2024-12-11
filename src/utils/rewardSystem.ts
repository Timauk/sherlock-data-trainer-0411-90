import { systemLogger } from './logging/systemLogger';

export const calculateReward = (matches: number): number => {
  systemLogger.log('reward', 'Calculando recompensa', {
    matches,
    timestamp: new Date().toISOString()
  });

  // Sistema de recompensa (11-15 acertos)
  if (matches >= 11) {
    const reward = Math.pow(2, matches - 10);
    systemLogger.log('reward', `Recompensa calculada: ${reward}`, {
      matches,
      reward,
      timestamp: new Date().toISOString()
    });
    return reward;
  }
  // Sistema neutro (6-10 acertos)
  else if (matches >= 6) {
    systemLogger.log('reward', 'Sem pontuação', {
      matches,
      timestamp: new Date().toISOString()
    });
    return 0;
  }
  // Punição leve para menos de 6 acertos
  systemLogger.log('reward', 'Penalidade aplicada', {
    matches,
    penalty: -1,
    timestamp: new Date().toISOString()
  });
  return -1;
};

export const logReward = (matches: number, playerId: number): string => {
  const reward = calculateReward(matches);
  let message = '';

  if (reward > 0) {
    message = `[Jogador #${playerId}] Premiação: +${reward} pontos por acertar ${matches} números!`;
  } else if (reward < 0) {
    message = `[Jogador #${playerId}] Penalidade: ${reward} pontos por acertar apenas ${matches} números.`;
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