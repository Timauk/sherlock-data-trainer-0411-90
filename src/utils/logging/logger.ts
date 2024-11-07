import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do transporte de logs
const transport = pino.transport({
  targets: [
    {
      // Console com formatação colorida
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
      level: 'info'
    },
    {
      // Arquivo de log com rotação diária
      target: 'pino/file',
      options: { 
        destination: path.join(__dirname, '../../../logs/app.log'),
        mkdir: true,
        sync: false,
        append: true
      },
      level: 'debug'
    }
  ]
});

// Configuração do logger
export const logger = pino({
  level: 'debug',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  hooks: {
    logMethod(inputArgs, method) {
      if (inputArgs.length >= 2) {
        const arg1 = inputArgs[0];
        const arg2 = inputArgs[1];
        if (typeof arg1 === 'object') {
          // Se o primeiro argumento é um objeto, mantém o formato padrão
          return method.apply(this, inputArgs);
        }
        // Se o primeiro argumento é uma string, trata como mensagem
        return method.apply(this, [{
          msg: arg1,
          details: arg2
        }]);
      }
      return method.apply(this, inputArgs);
    }
  }
}, transport);

// Exemplo de uso:
// logger.info('Iniciando aplicação');
// logger.error('Erro na operação', { error: 'detalhes do erro' });
// logger.debug('Debug info', { data: 'dados detalhados' });