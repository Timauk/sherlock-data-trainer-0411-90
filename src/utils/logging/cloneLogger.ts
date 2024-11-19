import { logger } from './logger';
import { Player } from '@/types/gameTypes';

class CloneLogger {
  private static instance: CloneLogger;
  private logPath: string;

  private constructor() {
    // Só configura o caminho se estiver rodando no Node.js
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fs = require('fs');
      const path = require('path');
      this.logPath = path.join(process.cwd(), 'logs', 'cloning.log');
      this.ensureLogDirectory();
    }
  }

  static getInstance(): CloneLogger {
    if (!CloneLogger.instance) {
      CloneLogger.instance = new CloneLogger();
    }
    return CloneLogger.instance;
  }

  private ensureLogDirectory() {
    if (typeof process !== 'undefined' && process.versions?.node) {
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(this.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  logCloneEvent(originalPlayer: Player, newPlayers: Player[], generation: number) {
    const timestamp = new Date().toISOString();
    const logMessage = `
[${timestamp}] Clonagem Realizada
Geração: ${generation}
Jogador Original: #${originalPlayer.id}
Score Original: ${originalPlayer.score}
Fitness Original: ${originalPlayer.fitness}
Número de Clones: ${newPlayers.length}
Performance dos Clones:
${newPlayers.map(p => `- Clone #${p.id}: Score Inicial ${p.score}, Fitness Inicial ${p.fitness}`).join('\n')}
----------------------------------------`;

    // Log no console para desenvolvimento
    logger.info({
      event: 'cloning',
      originalPlayer: originalPlayer.id,
      generation,
      clonesCount: newPlayers.length
    }, 'Clonagem realizada');

    // Se estiver rodando no Node.js, salva no arquivo
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const fs = require('fs');
        fs.appendFileSync(this.logPath, logMessage + '\n');
      } catch (error) {
        logger.error('Erro ao salvar log de clonagem:', error);
      }
    }
  }

  getCloneLogs(): string[] {
    if (typeof process !== 'undefined' && process.versions?.node) {
      try {
        const fs = require('fs');
        if (fs.existsSync(this.logPath)) {
          const content = fs.readFileSync(this.logPath, 'utf-8');
          return content.split('\n').filter(line => line.trim());
        }
      } catch (error) {
        logger.error('Erro ao ler logs de clonagem:', error);
      }
    }
    return [];
  }
}

export const cloneLogger = CloneLogger.getInstance();