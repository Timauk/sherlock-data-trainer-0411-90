// Verificar se estamos no ambiente Node.js
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;

let logger;

if (isNode) {
  // Configuração para Node.js
  const transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    }
  };

  logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
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