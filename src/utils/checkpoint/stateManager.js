import path from 'path';
import { logger } from '../logging/logger.js';

export class StateManager {
  constructor(fileManager) {
    this.fileManager = fileManager;
  }

  async saveGameState(checkpointDir, data) {
    try {
      await this.fileManager.writeFile(
        path.join(checkpointDir, 'gameState.json'),
        data.gameState
      );
      logger.debug('Game state saved successfully');
    } catch (error) {
      logger.error('Error saving game state:', error);
      throw error;
    }
  }

  async loadGameState(checkpointDir) {
    try {
      const gameState = await this.fileManager.readFile(
        path.join(checkpointDir, 'gameState.json')
      );
      logger.debug('Game state loaded successfully');
      return gameState;
    } catch (error) {
      logger.error('Error loading game state:', error);
      return null;
    }
  }
}