import pino from 'pino';
import NodeCache from 'node-cache';

// Verificar se estamos no ambiente Node.js
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;

let logger;

if (isNode) {
  // Configuração para Node.js
  const transport = pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
        level: 'info'
      },
      {
        target: 'pino/file',
        options: { 
          destination: './logs/app.log',
          mkdir: true 
        },
        level: 'debug'
      }
    ]
  });

  logger = pino({
    level: 'debug',
    base: undefined,
  }, transport);
} else {
  // Configuração para navegador
  logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
}

export { logger };