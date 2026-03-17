const winston = require('winston');

// Production-grade logging configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'billions-verifier',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs to separate file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // All logs to combined file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Production console logging (structured JSON)
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.json()
  }));
}

// Helper methods for common log patterns
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    statusCode: res.statusCode,
    duration: `${duration}ms`
  });
};

logger.logVerification = (sessionId, status, userDid = null) => {
  logger.info('Verification Event', {
    sessionId,
    status,
    userDid,
    useCase: process.env.USE_CASE
  });
};

logger.logRedisOperation = (operation, key, success) => {
  logger.debug('Redis Operation', {
    operation,
    key,
    success,
    timestamp: new Date().toISOString()
  });
};

logger.logSecurityEvent = (event, details, severity = 'warn') => {
  logger[severity]('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    alerting: severity === 'error'
  });
};

module.exports = logger;