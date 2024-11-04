import { FileManager } from '../../src/utils/checkpoint/fileManager.js';
import { ModelManager } from '../../src/utils/checkpoint/modelManager.js';
import { StateManager } from '../../src/utils/checkpoint/stateManager.js';
import { logger } from '../../src/utils/logging/logger.js';
import path from 'path';
import fs from 'fs';

class CheckpointManager {
  static instance = null;
  
  constructor() {
    this.checkpointPath = path.join(process.cwd(), 'checkpoints');
    this.maxCheckpoints = 50;
    
    this.fileManager = new FileManager(this.checkpointPath);
    this.modelManager = new ModelManager(this.fileManager);
    this.stateManager = new StateManager(this.fileManager);
  }

  static getInstance() {
    if (!CheckpointManager.instance) {
      CheckpointManager.instance = new CheckpointManager();
    }
    return CheckpointManager.instance;
  }

  async saveCheckpoint(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const checkpointDir = path.join(this.checkpointPath, `checkpoint-${timestamp}`);

    logger.info({
      checkpoint: checkpointDir,
      timestamp
    }, 'Iniciando salvamento de checkpoint completo');

    try {
      // 1. Salvar CSV original
      if (data.csvData) {
        await this.fileManager.writeFile(
          path.join(checkpointDir, 'dataset.csv'),
          data.csvData
        );
      }

      // 2. Salvar estado completo do jogo
      await this.stateManager.saveGameState(checkpointDir, data);

      // 3. Salvar modelo neural e otimizador
      if (data.gameState.model) {
        await this.modelManager.saveModel(data.gameState.model, checkpointDir);
      }

      // 4. Criar manifest
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'manifest.json'),
        {
          version: '1.1',
          timestamp,
          files: [
            'dataset.csv',
            'gameState.json',
            'model.json',
            'model.weights.bin',
            'optimizer_state.bin',
            'training_data.json',
            'predictions_cache.json',
            'evolution_history.json',
            'environment_config.json'
          ]
        }
      );

      await this.cleanOldCheckpoints();
      logger.info(`Checkpoint completo salvo: ${path.basename(checkpointDir)}`);
      return path.basename(checkpointDir);

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Erro ao salvar checkpoint');
      throw error;
    }
  }

  async loadLatestCheckpoint() {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort()
      .reverse();

    if (checkpoints.length === 0) {
      logger.warn('Nenhum checkpoint encontrado');
      return null;
    }

    const latestCheckpoint = checkpoints[0];
    const checkpointDir = path.join(this.checkpointPath, latestCheckpoint);

    try {
      // 1. Verificar manifest
      const manifest = await this.fileManager.readFile(
        path.join(checkpointDir, 'manifest.json')
      );

      // 2. Carregar CSV
      const csvData = await this.fileManager.readFile(
        path.join(checkpointDir, 'dataset.csv')
      );

      // 3. Carregar estado do jogo completo
      const gameState = await this.stateManager.loadGameState(checkpointDir);

      // 4. Carregar modelo neural e otimizador
      if (gameState) {
        gameState.model = await this.modelManager.loadModel(checkpointDir);
      }

      logger.info('Checkpoint carregado com sucesso');
      return {
        timestamp: latestCheckpoint.replace('checkpoint-', ''),
        gameState,
        csvData
      };

    } catch (error) {
      logger.error({ error, checkpoint: checkpointDir }, 'Erro ao carregar checkpoint');
      throw error;
    }
  }

  async cleanOldCheckpoints() {
    const checkpoints = fs.readdirSync(this.checkpointPath)
      .filter(f => f.startsWith('checkpoint-'))
      .sort();

    if (checkpoints.length > this.maxCheckpoints) {
      const checkpointsToDelete = checkpoints.slice(0, checkpoints.length - this.maxCheckpoints);
      for (const checkpoint of checkpointsToDelete) {
        const checkpointPath = path.join(this.checkpointPath, checkpoint);
        await fs.promises.rm(checkpointPath, { recursive: true });
        logger.info(`Checkpoint antigo removido: ${checkpoint}`);
      }
    }
  }
}

export const checkpointManager = CheckpointManager.getInstance();
