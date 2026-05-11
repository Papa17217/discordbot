import winston from 'winston';
import Transport from 'winston-transport';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Specjalny transport wysyłający logi do API (dla konsoli na stronie)
class ApiTransport extends Transport {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    const apiUrl = process.env.API_URL || 'http://localhost:4000/api';
    const botToken = process.env.DISCORD_TOKEN;

    // Wysyłamy tylko jeśli nie jesteśmy w pętli logowania błędów API
    fetch(`${apiUrl}/admin/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bot-token': botToken || '',
      },
      body: JSON.stringify({
        level: info.level,
        message: info.message,
        timestamp: info.timestamp,
      }),
    }).catch(() => {
      // Ignorujemy błędy, żeby nie zapętlić loggera
    });

    callback();
  }
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new ApiTransport(),
  ],
});

