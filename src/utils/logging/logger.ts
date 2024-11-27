interface Logger {
  debug: (message: any, ...args: any[]) => void;
  info: (message: any, ...args: any[]) => void;
  warn: (message: any, ...args: any[]) => void;
  error: (message: any, ...args: any[]) => void;
}

// Verificar se estamos no ambiente Node.js
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;

const logger: Logger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

export { logger };