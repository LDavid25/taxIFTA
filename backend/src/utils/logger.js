const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors, splat } = format;
const path = require('path');
const fs = require('fs');
const os = require('os');
const DailyRotateFile = require('winston-daily-rotate-file');
const { isObject } = require('./helpers');
const config = require('../config/config');

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  silly: 5
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  silly: 'gray'
};

// Add colors to winston
winston.addColors(colors);

// Ensure log directory exists
const logDir = config.logs.dir || path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const ts = timestamp.slice(0, 19).replace('T', ' ');
  let log = `${ts} [${level}]: ${message}`;
  
  // Add stack trace if available
  if (stack) {
    log += '\n' + stack;
  }
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    log += '\n' + JSON.stringify(meta, null, 2);
  }
  
  return log;
});

// Custom format for file output
const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const ts = timestamp.slice(0, 19).replace('T', ' ');
  const log = {
    timestamp: ts,
    level: level.toUpperCase(),
    message,
    ...(stack && { stack }),
    ...(Object.keys(meta).length > 0 && { meta })
  };
  
  return JSON.stringify(log);
});

// Filter out sensitive information
const sensitiveFields = ['password', 'token', 'authorization', 'apiKey', 'apikey'];
const redactSensitiveInfo = format((info) => {
  if (isObject(info.message)) {
    info.message = redactObject(info.message);
  } else if (isObject(info.meta)) {
    info.meta = redactObject(info.meta);
  }
  return info;
});

// Helper to redact sensitive fields in an object
function redactObject(obj) {
  if (!isObject(obj)) return obj;
  
  const result = { ...obj };
  
  for (const key of Object.keys(result)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      result[key] = '***REDACTED***';
    } else if (isObject(result[key])) {
      result[key] = redactObject(result[key]);
    } else if (Array.isArray(result[key])) {
      result[key] = result[key].map(item => 
        isObject(item) ? redactObject(item) : item
      );
    }
  }
  
  return result;
}

// Create the base logger instance
const logger = winston.createLogger({
  level: config.logs.level || 'info',
  levels,
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    redactSensitiveInfo(),
    json()
  ),
  defaultMeta: {
    service: config.app.name || 'ifta-easy-tax-api',
    hostname: os.hostname(),
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
    version: config.app.version
  },
  transports: [
    // Console transport - only in development
    ...(config.isDevelopment ? [new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp(),
        consoleFormat
      ),
      handleExceptions: true,
      handleRejections: true,
      level: 'debug'
    })] : []),
    
    // Daily rotate file transport for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      format: combine(
        timestamp(),
        fileFormat
      ),
      level: 'info'
    }),
    
    // Error log file
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep error logs for 30 days
      level: 'error',
      format: combine(
        timestamp(),
        fileFormat
      )
    }),
    
    // HTTP request log file
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '7d', // Keep HTTP logs for 7 days
      level: 'http',
      format: combine(
        timestamp(),
        fileFormat
      )
    })
  ],
  exitOnError: false, // Don't exit on handled exceptions
  silent: process.env.NODE_ENV === 'test' // Disable logging in test environment
});

// Add a stream for morgan to use for HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Add a method to log unhandled exceptions and rejections
const handleExceptions = () => {
  // Log unhandled exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // In production, you might want to perform some cleanup or send alerts
    if (config.isProduction) {
      // Send alert to monitoring service
      // sendAlertToMonitoringService(error);
    }
    // Don't exit in development to allow for debugging
    if (config.isProduction) {
      process.exit(1);
    }
  });

  // Log unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to perform some cleanup or send alerts
    if (config.isProduction) {
      // Send alert to monitoring service
      // sendAlertToMonitoringService(reason);
    }
  });

  // Handle process termination
  const handleShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    
    // Close the logger and exit
    logger.on('finish', () => {
      process.exit(0);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
      logger.warn('Forcing shutdown after timeout');
      process.exit(1);
    }, 5000);
    
    // End the logger
    logger.end();
  };

  // Handle process termination signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // For nodemon
};

// Initialize exception handling
if (config.isProduction) {
  handleExceptions();
}

// Add a method to log HTTP requests
logger.httpLogMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Skip logging for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  // Log the request
  logger.http('Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer || '',
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '***REDACTED***' : undefined
    }
  });
  
  // Log the response
  const originalEnd = res.end;
  res.end = (chunk, encoding) => {
    const duration = Date.now() - start;
    
    // Log the response
    logger.http('Response', {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length') || 0,
      url: req.originalUrl,
      method: req.method
    });
    
    // Call the original end function
    return originalEnd.call(res, chunk, encoding);
  };
  
  next();
};

// Add a method to log database queries
logger.queryLogger = (query, options) => {
  if (config.isDevelopment) {
    const { type, instance, model, sql, ...rest } = options;
    const logData = {
      type,
      model: model || (instance && instance.constructor.name),
      sql: sql || (query && query.sql) || 'N/A',
      ...rest
    };
    
    logger.debug('Database Query', logData);
  }
  return query;
};

// Add a method to log API errors
logger.apiError = (message, error = {}, meta = {}) => {
  const { status = 500, code, stack, ...errorDetails } = error;
  
  logger.error(message, {
    ...meta,
    error: {
      message: error.message || message,
      code: code || 'INTERNAL_SERVER_ERROR',
      status,
      ...(config.isDevelopment && { stack: stack || new Error().stack }),
      ...errorDetails
    }
  });
};

// Add a method to log API requests
logger.apiRequest = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, body, query, params, headers } = req;
  
  // Skip logging for health checks
  if (originalUrl === '/health' || originalUrl === '/api/health') {
    return next();
  }
  
  // Log the request
  logger.info('API Request', {
    method,
    url: originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: headers['user-agent'],
    body,
    query,
    params,
    headers: {
      ...headers,
      authorization: headers.authorization ? '***REDACTED***' : undefined
    }
  });
  
  // Log the response
  const originalEnd = res.end;
  res.end = (chunk, encoding) => {
    const duration = Date.now() - start;
    
    // Log the response
    logger.info('API Response', {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      url: originalUrl,
      method
    });
    
    // Call the original end function
    return originalEnd.call(res, chunk, encoding);
  };
  
  next();
};

module.exports = logger;
