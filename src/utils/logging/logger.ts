import pino from 'pino';

interface LogObject {
  msg: string;
  level: number;
  time: number;
  err?: Error;
  details?: any;
}

const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  browser: {
    asObject: true,
    write: {
      info: (o: LogObject) => console.log(o.msg, o.details || ''),
      error: (o: LogObject) => {
        console.error(o.msg);
        if (o.err) {
          console.error('Error details:', o.err);
        }
        if (o.details) {
          console.error('Additional details:', o.details);
        }
      },
      debug: (o: LogObject) => console.debug(o.msg, o.details || ''),
      warn: (o: LogObject) => console.warn(o.msg, o.details || '')
    }
  }
});

export { logger };