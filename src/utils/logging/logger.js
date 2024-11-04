import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        destination: path.join(__dirname, '../../../logs/app.log'),
        mkdir: true 
      },
      level: 'debug'
    }
  ]
});

export const logger = pino({
  level: 'debug',
  base: undefined,
}, transport);