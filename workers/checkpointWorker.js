import { parentPort } from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import NodeCache from 'node-cache';
import { logger } from '../utils/logging/logger.js';

// Cache configurado com TTL de 1 hora e limpeza a cada 2 minutos
const cache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120,
  maxKeys: 1000 // Limite máximo de chaves
});

async function saveCheckpoint(data) {
  try {
    const checkpointDir = path.join(process.cwd(), 'checkpoints', `checkpoint-${data.timestamp}`);
    await fs.mkdir(checkpointDir, { recursive: true });

    console.log('📁 Salvando checkpoint em:', checkpointDir);

    // Comprime e salva estado do jogo
    const gameState = JSON.stringify(data.gameState);
    await fs.writeFile(
      path.join(checkpointDir, 'gameState.json'),
      gameState
    );
    console.log('💾 Estado do jogo salvo');

    // Cache apenas dados críticos
    cache.set(
      `checkpoint:${data.timestamp}:predictions`,
      data.gameState.predictionsCache,
      1800 // TTL de 30 minutos para previsões
    );
    console.log('🎯 Cache de previsões atualizado');

    // Limpa memória após salvar
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection executada após salvar checkpoint');
    }

    parentPort.postMessage({
      success: true,
      filename: path.basename(checkpointDir)
    });

  } catch (error) {
    console.error('❌ Erro ao salvar checkpoint:', error);
    logger.error('Erro ao salvar checkpoint:', error);
    parentPort.postMessage({
      success: false,
      error: error.message
    });
  }
}

// Limpa cache periodicamente
setInterval(() => {
  const stats = cache.getStats();
  console.log('📊 Worker Cache Stats:', stats);
  
  cache.flushAll(); // Using flushAll instead of prune
  console.log('🧹 Cache do worker limpo');
  
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection executada no worker');
  }
}, 300000); // A cada 5 minutos

parentPort.on('message', async (message) => {
  if (message.type === 'SAVE_CHECKPOINT') {
    console.log('📥 Recebida mensagem para salvar checkpoint');
    await saveCheckpoint(message.data);
  }
});