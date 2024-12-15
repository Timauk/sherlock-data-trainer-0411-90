import { systemLogger } from './systemLogger';

export const gameLogger = {
  logGameState: (state: any) => {
    systemLogger.log('game', 'Estado atual do jogo', {
      generation: state.generation,
      totalPlayers: state.players?.length,
      champion: state.champion ? {
        id: state.champion.id,
        score: state.champion.score
      } : null,
      timestamp: new Date().toISOString()
    });
  },

  logEvolution: (data: any) => {
    systemLogger.log('evolution', 'Evolução da geração', {
      generation: data.generation,
      bestScore: data.bestScore,
      averageScore: data.averageScore,
      timestamp: new Date().toISOString()
    });
  },

  logMemoryUsage: () => {
    const memoryUsage = process.memoryUsage();
    systemLogger.log('performance', 'Uso de memória', {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      timestamp: new Date().toISOString()
    });
  }
};