const winston = require('winston');

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
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10,
      tailable: true
    })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  logger.add(new winston.transports.Console({
    format: winston.format.json()
  }));
}

logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
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

logger.logSecurityEvent = (event, details, severity = 'warn') => {
  logger[severity]('Security Event', {
    event,
    details,
    alerting: severity === 'error'
  });
};

module.exports = logger;
