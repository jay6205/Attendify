import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Format for console (readable with colors)
const consoleFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    })
);

// Format for files (structured JSON)
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

// Define severity levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};

const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        })
    ],
});

export default logger;
