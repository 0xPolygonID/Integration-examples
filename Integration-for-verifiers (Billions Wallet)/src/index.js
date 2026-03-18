require('dotenv').config();

const path = require("path");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { auth, resolver } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const cors = require('cors');
const { randomInt } = require('crypto');

const { getConfig, createProofRequest } = require('./config/verification-configs');
const redisService = require('./services/redis-service');
const dbService = require('./services/db-service');
const logger = require('./services/logger');

const app = express();
const port = process.env.PORT || 8080;

const USE_CASE = process.env.USE_CASE;
const nullifierSessionID = process.env.NULLIFIER_SESSION_ID;
const currentConfig = getConfig(USE_CASE);

let cachedVerifier = null;

function generateSessionId() {
  return randomInt(10000000, 100000000);
}

async function getVerifierInstance() {
  if (cachedVerifier) return cachedVerifier;

  logger.info('Initializing verifier instance...');
  const t = Date.now();

  cachedVerifier = await auth.Verifier.newVerifier({
    stateResolver: {
      ["billions:main"]: new resolver.EthStateResolver(
        "https://rpc-mainnet.billions.network",
        "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
      ),
      ["privado:main"]: new resolver.EthStateResolver(
        "https://rpc-mainnet.privado.id",
        "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
      ),
      ["billions:test"]: new resolver.EthStateResolver(
        "https://billions-testnet-rpc.eu-north-2.gateway.fm",
        "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"
      )
    },
    circuitsDir: path.join(process.cwd(), "public/keys"),
    ipfsGatewayURL: "https://ipfs.io",
  });

  logger.info('Verifier initialized', { initTimeMs: Date.now() - t });
  return cachedVerifier;
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"]
    }
  }
}));

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    logger.logSecurityEvent('CORS_BLOCKED', { origin, allowedOrigins }, 'warn');
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      url: req.url
    }, 'warn');
    res.status(429).json({ error: "Too many requests", retryAfter: "1 minute" });
  }
}));

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));
app.use(express.static("./public"));

app.get("/api/verification-request", async (req, res) => {
  const startTime = Date.now();
  try {
    const hostUrl = process.env.HOST_URL;
    if (!hostUrl) {
      logger.error("HOST_URL is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!process.env.VERIFIER_DID) {
      logger.error("VERIFIER_DID is not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const sessionId = generateSessionId();
    const uri = `${hostUrl}/api/callback?sessionId=${sessionId}`;

    const request = auth.createAuthorizationRequest(
      currentConfig.verification_description,
      process.env.VERIFIER_DID,
      uri
    );

    const proofRequest = createProofRequest(USE_CASE, sessionId, nullifierSessionID);
    request.body.scope = [...(request.body.scope ?? []), proofRequest];

    const authStored = await redisService.setAuthRequest(sessionId, request);
    const statusStored = await redisService.setVerificationStatus(proofRequest.id, "pending");

    if (!authStored || !statusStored) {
      logger.warn('Redis storage failed, falling back to memory cache', { sessionId });
    }

    logger.info('Verification request generated', { sessionId, useCase: USE_CASE });
    logger.logRequest(req, res, Date.now() - startTime);

    return res.status(200).json(request);
  } catch (err) {
    logger.error("Error in /api/verification-request", { error: err.message, stack: err.stack });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const redisHealthy = await redisService.healthCheck();
    const redisStatus = redisService.getStatus();
    const cacheStats = redisService.getCacheStats();

    const hasMemoryFallback = cacheStats.totalEntries > 0;
    const status = redisHealthy ? 'healthy' : (hasMemoryFallback ? 'degraded' : 'unhealthy');
    const statusCode = redisHealthy ? 200 : (hasMemoryFallback ? 206 : 503);

    return res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      redis: {
        connected: redisHealthy,
        host: process.env.REDIS_HOST,
        circuitBreaker: redisStatus.circuitBreakerOpen,
        failures: redisStatus.failures,
        reconnectAttempts: redisStatus.reconnectAttempts
      },
      memoryCache: {
        active: !redisHealthy && hasMemoryFallback,
        size: cacheStats.totalEntries,
        utilization: `${cacheStats.utilizationPercent}%`,
        averageAge: `${Math.round(cacheStats.averageAgeMs / 1000)}s`
      },
      server: {
        port,
        useCase: USE_CASE,
        config: currentConfig.name
      }
    });
  } catch (error) {
    logger.error('Error in /api/health', { error: error.message });
    return res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

app.get("/api/status/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId) || requestId <= 0) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const status = await redisService.getVerificationStatus(requestId) || "not_found";
    return res.status(200).json({ requestId, status });
  } catch (error) {
    logger.error("Error in /api/status", { error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/callback", async (req, res) => {
  const startTime = Date.now();

  try {
    const sessionId = parseInt(req.query.sessionId);
    if (isNaN(sessionId) || sessionId < 10000000 || sessionId >= 100000000) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    const raw = await getRawBody(req, {
      length: req.headers['content-length'],
      limit: '1mb',
      encoding: 'utf8'
    });
    const tokenStr = raw.toString().trim();

    if (!tokenStr) {
      return res.status(400).json({ error: "Missing token" });
    }

    if (tokenStr.length > 100000) {
      return res.status(400).json({ error: "Token too large" });
    }

    const authRequest = await redisService.getAuthRequest(sessionId);
    if (!authRequest) {
      return res.status(400).json({ error: "Session not found or expired" });
    }

    const verifier = await getVerifierInstance();
    const authResponse = await verifier.fullVerify(tokenStr, authRequest, {
      AcceptedStateTransitionDelay: 5 * 60 * 1000,
    });

    if (!authResponse?.body?.scope) {
      return res.status(400).json({ error: "Malformed response from verifier" });
    }

    const nullifierProof = authResponse.body.scope.find(
      (s) => s.circuitId === "credentialAtomicQueryV3-beta.1" && s.id === sessionId
    );
    if (!nullifierProof) {
      return res.status(400).json({ error: "No valid nullifier proof found" });
    }

    const nullifierHash = nullifierProof.pub_signals?.[1];
    if (!nullifierHash) {
      logger.error('Nullifier extraction failed', {
        sessionId,
        signalCount: nullifierProof.pub_signals?.length
      });
      return res.status(400).json({ error: "Could not extract nullifier from proof" });
    }

    const scopeEntry = authRequest.body.scope.find(
      (s) => s.circuitId === "credentialAtomicQueryV3-beta.1"
    );
    const proofRequestId = scopeEntry?.id;

    const { claimed } = await dbService.claimNullifier(nullifierHash, sessionId);
    if (!claimed) {
      logger.logSecurityEvent('REPLAY_ATTACK_BLOCKED', {
        nullifierHash: nullifierHash.substring(0, 20) + '...',
        sessionId
      }, 'warn');

      if (proofRequestId) {
        await redisService.setVerificationStatus(proofRequestId, "already_verified");
      }

      return res.status(400).json({ error: "This identity has already been verified." });
    }

    if (proofRequestId) {
      await redisService.setVerificationStatus(proofRequestId, "success");
    }

    logger.logVerification(sessionId, 'success', authResponse.from);
    logger.logRequest(req, res, Date.now() - startTime);

    return res.status(200).set("Content-Type", "application/json").send(authResponse);

  } catch (error) {
    logger.error("Error in /api/callback", { error: error.message, stack: error.stack });

    if (error.message?.includes('verification')) {
      return res.status(400).json({
        error: "Verification failed",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
});

function validateEnvironment() {
  const required = [
    'USE_CASE', 'VERIFIER_DID', 'NULLIFIER_SESSION_ID',
    'HOST_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_USERNAME', 'REDIS_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const validUseCases = ['POH', 'POU', 'POVH'];
  if (!validUseCases.includes(process.env.USE_CASE?.toUpperCase())) {
    throw new Error(`Invalid USE_CASE: ${process.env.USE_CASE}. Must be one of: ${validUseCases.join(', ')}`);
  }

  try {
    new URL(process.env.HOST_URL);
  } catch {
    throw new Error(`Invalid HOST_URL: ${process.env.HOST_URL}`);
  }

  const redisPort = parseInt(process.env.REDIS_PORT);
  if (isNaN(redisPort) || redisPort < 1 || redisPort > 65535) {
    throw new Error(`Invalid REDIS_PORT: ${process.env.REDIS_PORT}`);
  }
}

async function startServer() {
  try {
    validateEnvironment();

    try {
      await redisService.connect();
      logger.info('Redis connected');
    } catch (redisError) {
      logger.warn('Redis unavailable at startup, running in degraded mode', {
        error: redisError.message
      });
    }

    const server = app.listen(port, () => {
      logger.info('Server started', {
        port,
        useCase: USE_CASE,
        nodeEnv: process.env.NODE_ENV,
        redisConnected: redisService.isHealthy()
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

(async () => {
  const server = await startServer();

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await redisService.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
