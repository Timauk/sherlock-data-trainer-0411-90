import { systemLogger } from './systemLogger';

export const predictionLogger = {
  logModelState: (model: any, phase: string) => {
    systemLogger.log('model', `Estado do modelo - ${phase}`, {
      layers: model?.layers?.length,
      inputShape: model?.inputs?.[0]?.shape,
      outputShape: model?.outputs?.[0]?.shape,
      compiled: !!model?.optimizer,
      timestamp: new Date().toISOString()
    });
  },

  logPredictionGeneration: (gameIndex: number, data: any) => {
    systemLogger.log('prediction', `Geração do jogo #${gameIndex + 1}`, {
      championId: data.championId,
      weightsUsed: true,
      timestamp: new Date().toISOString(),
      weightsSample: data.weights?.slice(0, 5),
      probabilitiesSample: data.probabilities?.slice(0, 5)
    });
  },

  logPlayerWeights: (playerId: number, weights: number[]) => {
    systemLogger.log('weights', `Pesos do jogador #${playerId}`, {
      weightsLength: weights.length,
      weightsSample: weights.slice(0, 5),
      weightsStats: {
        min: Math.min(...weights),
        max: Math.max(...weights),
        avg: weights.reduce((a, b) => a + b, 0) / weights.length
      },
      timestamp: new Date().toISOString()
    });
  },

  logError: (context: string, error: any) => {
    systemLogger.error('prediction', `Erro em ${context}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};