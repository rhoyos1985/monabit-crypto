import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const isProduction = process.env.NODE_ENV === 'production';

// En produccion (Cloud Run) se loguea en JSON a stdout, donde la plataforma
// recoge los logs. En desarrollo se usa salida coloreada y legible.
const consoleFormat = isProduction
  ? logFormat
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.printf((info) => {
        const { level, message, timestamp, stack, ...meta } = info as {
          level: string;
          message: string;
          timestamp: string;
          stack?: string;
          [key: string]: unknown;
        };
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}${stack ? `\n${stack}` : ''}`;
      })
    );

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    // Transports de archivo solo en desarrollo: en Cloud Run el filesystem es
    // efimero y el proceso corre como usuario sin permiso de escritura, lo que
    // provoca EACCES al hacer mkdir 'logs'. Los logs de prod salen por stdout.
    ...(isProduction
      ? []
      : [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]),
  ],
});

export default logger;
