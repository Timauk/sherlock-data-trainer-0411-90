import pino from 'pino';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
      level: 'info'
    }
  ]
});

export const logger = pino({
  level: 'debug',
  base: undefined,
}, transport);