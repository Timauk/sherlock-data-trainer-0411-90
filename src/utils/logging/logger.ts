import pino from 'pino';

const logger = pino({
  level: 'debug',
  browser: {
    asObject: true,
    write: {
      info: (o) => console.log(o.msg),
      error: (o) => console.error(o.msg),
      debug: (o) => console.debug(o.msg),
      warn: (o) => console.warn(o.msg)
    }
  }
});

export { logger };