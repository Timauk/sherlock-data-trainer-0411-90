import pino from 'pino';

interface LogObject {
  msg: string;
  level: number;
  time: number;
}

const logger = pino({
  level: 'debug',
  browser: {
    asObject: true,
    write: {
      info: (o: LogObject) => console.log(o.msg),
      error: (o: LogObject) => console.error(o.msg),
      debug: (o: LogObject) => console.debug(o.msg),
      warn: (o: LogObject) => console.warn(o.msg)
    }
  }
});

export { logger };