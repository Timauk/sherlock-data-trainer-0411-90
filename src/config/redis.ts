import { createClient } from 'redis';
import { logger } from '../utils/logging/logger.js';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_USERNAME = process.env.REDIS_USERNAME;

export const createRedisClient = () => {
  const client = createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
  });

  client.on('error', (err) => {
    logger.error('Erro Redis:', err);
    throw new Error(`Erro na conexão Redis: ${err.message}`);
  });

  client.on('connect', () => {
    logger.info('Redis conectado com sucesso');
  });

  return client;
};