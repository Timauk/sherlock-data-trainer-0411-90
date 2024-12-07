import { Player } from '@/types/gameTypes';
import { systemLogger } from './systemLogger';

export const logPlayerActivity = (player: Player, action: string, details: any) => {
  systemLogger.log('player', `[Jogador #${player.id}] ${action}`, {
    ...details,
    playerState: {
      score: player.score,
      fitness: player.fitness,
      generation: player.generation,
      predictions: player.predictions.length > 0 ? player.predictions : 'Sem previsões'
    },
    timestamp: new Date().toISOString()
  });
};

export const logEvolutionEvent = (
  generation: number, 
  players: Player[], 
  champion: Player | null
) => {
  systemLogger.log('evolution', `Geração ${generation} completada`, {
    totalPlayers: players.length,
    championId: champion?.id,
    championFitness: champion?.fitness,
    populationStats: {
      avgFitness: players.reduce((sum, p) => sum + p.fitness, 0) / players.length,
      maxFitness: Math.max(...players.map(p => p.fitness)),
      minFitness: Math.min(...players.map(p => p.fitness))
    },
    timestamp: new Date().toISOString()
  });
};