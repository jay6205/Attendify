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

import 'winston-daily-rotate-file';

// Setup Daily Rotate File Transports
const errorTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '14d',
    level: 'error',
});

const combinedTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '14d',
});

const exceptionTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '14d',
});

const rejectionTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '5m',
    maxFiles: '14d',
});

const transports = [
    new winston.transports.Console({
        format: consoleFormat,
    })
];

const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
    transports.push(errorTransport);
    transports.push(combinedTransport);
}

const logger = winston.createLogger({
    level: level(),
    levels,
    format: fileFormat,
    transports,
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        ...(env === 'production' ? [exceptionTransport] : [])
    ],
    rejectionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        ...(env === 'production' ? [rejectionTransport] : [])
    ],
});

export default logger;
