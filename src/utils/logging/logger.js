import pino from 'pino';

const transport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname'
  }
};

export const logger = pino({
  transport,
  level: 'debug',
  base: undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  }
});

// Função auxiliar para colorir as mensagens de log
export const colorizeLog = (type, message) => {
  const colors = {
    info: '\x1b[32m', // Verde
    warn: '\x1b[33m', // Amarelo
    error: '\x1b[31m', // Vermelho
    reset: '\x1b[0m'  // Reset
  };

  return `${colors[type]}%s${colors.reset}`;
};