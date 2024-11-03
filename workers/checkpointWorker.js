import { parentPort } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { createRedisClient } from '../src/config/redis.js';
import { logger } from '../utils/logging/logger.js';

const redis = createRedisClient();

async function saveCheckpoint(data) {
  try {
    await redis.connect();
    
    const checkpointDir = path.join(process.cwd(), 'checkpoints', `checkpoint-${data.timestamp}`);
    await fs.mkdir(checkpointDir, { recursive: true });

    // Salva estado do jogo
    await fs.writeFile(
      path.join(checkpointDir, 'gameState.json'),
      JSON.stringify(data.gameState, null, 2)
    );

    // Salva modelo neural
    if (data.gameState.model) {
      await fs.writeFile(
        path.join(checkpointDir, 'model.json'),
        JSON.stringify(data.gameState.model)
      );
    }

    // Salva dados de treinamento
    await fs.writeFile(
      path.join(checkpointDir, 'training_data.json'),
      JSON.stringify(data.gameState.trainingData || [])
    );

    // Salva cache no Redis
    await redis.set(
      `checkpoint:${data.timestamp}:cache`,
      JSON.stringify(data.gameState.predictionsCache || {})
    );

    // Salva métricas
    await fs.writeFile(
      path.join(checkpointDir, 'metrics.json'),
      JSON.stringify({
        systemInfo: data.systemInfo,
        modelMetrics: data.gameState.modelMetrics,
        performance: data.gameState.performance
      })
    );

    await redis.quit();

    parentPort.postMessage({
      success: true,
      filename: path.basename(checkpointDir)
    });

  } catch (error) {
    logger.error('Erro ao salvar checkpoint:', error);
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
}

parentPort.on('message', async (message) => {
  if (message.type === 'SAVE_CHECKPOINT') {
    await saveCheckpoint(message.data);
  }
});
