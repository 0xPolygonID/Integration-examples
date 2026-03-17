
// Load environment variables
require('dotenv').config();

// Core dependencies
const path = require("path");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { auth, resolver } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const cors = require('cors');
const { AtomicQueryV3PubSignals } = require('@0xpolygonid/js-sdk');
const { randomInt, randomBytes } = require('crypto');

// Application modules
const { getConfig, createProofRequest } = require('./config/verification-configs');
const redisService = require('./services/redis-service');
const logger = require('./services/logger');

// Initialize Express app and configuration
const app = express();
const port = process.env.PORT || 8080;
const byteEncoder = new TextEncoder();

// Environment configuration
const USE_CASE = process.env.USE_CASE;
const nullifierSessionID = process.env.NULLIFIER_SESSION_ID;
const currentConfig = getConfig(USE_CASE);

// Cached verifier instance for performance
let cachedVerifier = null;
let verifierInitialized = false;

// Generate 8-digit numeric session ID compatible with BigInt conversion
function generateSecureSessionId() {
  return randomInt(10000000, 100000000); // Range: 10,000,000 to 99,999,999
}

// Initialize and cache verifier for performance
async function getVerifierInstance() {
  if (cachedVerifier && verifierInitialized) {
    return cachedVerifier;
  }

  try {
    logger.info('Initializing verifier instance...');
    const startTime = Date.now();

    // Configure network resolvers for blockchain state verification
    const resolvers = {
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
    };

    // Initialize verifier with circuits and resolvers
    cachedVerifier = await auth.Verifier.newVerifier({
      stateResolver: resolvers,
      circuitsDir: path.join(process.cwd(), "public/keys"),
      ipfsGatewayURL: "https://ipfs.io",
    });

    verifierInitialized = true;
    const initTime = Date.now() - startTime;
    logger.info('Verifier initialized successfully', { initTimeMs: initTime });

    return cachedVerifier;
  } catch (error) {
    logger.error('Failed to initialize verifier', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"], // Allow QR code library
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"]
    }
  }
}));

// CORS configuration with environment-based security
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || 'https://your-production-domain.com,https://your-app-domain.com').split(',').filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, be permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Block and log unauthorized origins
    logger.logSecurityEvent('CORS_BLOCKED', {
      origin,
      allowedOrigins,
      timestamp: new Date().toISOString()
    }, 'warn');

    return callback(new Error('Not allowed by CORS - Contact admin to whitelist your domain'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Enhanced rate limiting with security features
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute per IP
  message: {
    error: "Too many requests",
    details: "Rate limit exceeded. Please try again later.",
    retryAfter: "1 minute"
  },
  standardHeaders: true, // Include rate limit info in headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  handler: (req, res) => {
    logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    }, 'warn');

    res.status(429).json({
      error: "Too many requests",
      details: "Rate limit exceeded. Please try again later.",
      retryAfter: "1 minute"
    });
  }
}));

// Body parsing middleware with size limits for security
app.use(express.json({
  limit: '10mb', // Limit JSON payload size
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb', // Limit URL-encoded payload size
  parameterLimit: 1000 // Limit number of parameters
}));

// Serve static frontend files
app.use(express.static("./public"));

// Generate verification request for wallet authentication
app.get("/api/verification-request", async (req, res) => {
  const startTime = Date.now();
  try {
    const hostUrl = process.env.HOST_URL;
    const sessionId = generateSecureSessionId();
    const callbackURL = "/api/callback";

    // Validate required environment variables
    if (!hostUrl) {
      logger.error("Server misconfiguration: HOST_URL is missing");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Missing HOST_URL configuration"
      });
    }

    if (!process.env.VERIFIER_DID) {
      logger.error("Server misconfiguration: VERIFIER_DID is missing");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Missing VERIFIER_DID configuration"
      });
    }


    // Build callback URI with session ID
    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

    // Create authorization request for iden3 protocol
    const request = auth.createAuthorizationRequest(
      currentConfig.verification_description,
      process.env.VERIFIER_DID,
      uri
    );

    // Add proof request to scope
    const proofRequest = createProofRequest(USE_CASE, sessionId, nullifierSessionID);
    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Store in Redis for later verification with fallback handling
    const authStored = await redisService.setAuthRequest(sessionId, request);
    const statusStored = await redisService.setVerificationStatus(proofRequest.id, "pending");

    // Log Redis storage status for monitoring
    if (!authStored || !statusStored) {
      logger.warn('Redis storage failed, verification may not persist across restarts', {
        sessionId,
        authStored,
        statusStored
      });
    }

    logger.info('Verification request generated', { sessionId, useCase: USE_CASE });
    logger.logRequest(req, res, Date.now() - startTime);

    return res.status(200).json(request);
  } catch (err) {
    logger.error("Error in /api/verification-request", { error: err.message, stack: err.stack });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint for monitoring Redis and server status
app.get('/api/health', async (req, res) => {
  try {
    const redisHealthy = await redisService.healthCheck();
    const redisStatus = redisService.getStatus();
    const cacheStats = redisService.getCacheStats();

    // Determine overall health
    const hasMemoryFallback = cacheStats.totalEntries > 0;
    const status = redisHealthy ? 'healthy' : (hasMemoryFallback ? 'degraded' : 'unhealthy');
    const statusCode = redisHealthy ? 200 : (hasMemoryFallback ? 206 : 503);

    return res.status(statusCode).json({
      status: status,
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
        port: port,
        useCase: USE_CASE,
        config: currentConfig.name
      }
    });
  } catch (error) {
    console.error('Error in /api/health:', error);
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get verification status for a given request ID
app.get("/api/status/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId) || requestId <= 0) {
      return res.status(400).json({
        error: "Invalid request ID",
        details: "Request ID must be a positive integer"
      });
    }

    const status = await redisService.getVerificationStatus(requestId) || "not_found";

    return res.status(200).json({
      requestId: requestId,
      status: status,
    });
  } catch (error) {
    console.error("Error in /api/status:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify the proof after wallet sign-in callback
app.post("/api/callback", async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate session ID format (8-digit number)
    const sessionId = parseInt(req.query.sessionId);
    if (isNaN(sessionId) || sessionId < 10000000 || sessionId >= 100000000) {
      return res.status(400).json({
        error: "Invalid session ID",
        details: "Session ID must be an 8-digit number"
      });
    }

    // Extract and validate JWT token from request body with size limit
    const raw = await getRawBody(req, {
      length: req.headers['content-length'],
      limit: '1mb', // Limit raw body to 1MB for security
      encoding: 'utf8'
    });
    const tokenStr = raw.toString().trim();

    // ⚠️ TEMPORARY DEBUG: Log token for testing (REMOVE IN PRODUCTION)
    console.log('\n🔥🔥🔥 === TOKEN CAPTURE (For Testing) ===');
    console.log('Full Token:', tokenStr);
    console.log('Token Length:', tokenStr.length, 'characters');
    console.log('===========================================\n');


    // Validate token length for security
    if (tokenStr.length > 100000) { // ~100KB limit for JWT
      return res.status(400).json({
        error: "Token too large",
        details: "Authentication token exceeds maximum allowed size"
      });
    }

    if (!tokenStr) {
      return res.status(400).json({
        error: "Missing token",
        details: "No authentication token provided in request body"
      });
    }

    // Retrieve stored auth request from Redis
    const authRequest = await redisService.getAuthRequest(sessionId);
    if (!authRequest) {
      return res.status(400).json({
        error: "Invalid session",
        details: "Session ID not found or expired"
      });
    }

    // Get cached verifier instance for performance
    const verifier = await getVerifierInstance();

    // Verify the proof with 5-minute state transition delay
    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
    };
    const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);

    // Validate response structure
    if (!authResponse || !authResponse.body || !authResponse.body.scope) {
      return res.status(400).json({
        error: "Invalid authentication response",
        details: "Malformed response from verifier"
      });
    }

    // Find the nullifier proof in the response scope
    const nullifierProof = authResponse.body.scope.find(
      (s) => s.circuitId === "credentialAtomicQueryV3-beta.1" && s.id === sessionId
    );
    if (!nullifierProof) {
      return res.status(400).json({
        error: "Invalid proof",
        details: "No valid nullifier proof found in response"
      });
    }

    // =========================================================================
    // NULLIFIER ANTI-REPLAY LOGIC (PostgreSQL Integration)
    // =========================================================================

    console.log('\n🔐 === NULLIFIER EXTRACTION & VALIDATION ===');

    // Extract the Nullifier Hash from public signals
    // The nullifier is typically at index 1 in credentialAtomicQueryV3 public signals
    const nullifierHash = nullifierProof.pub_signals?.[1];

    if (!nullifierHash) {
      console.error('⚠️  WARNING: Could not extract nullifier from proof public signals');
      console.error('   Available signals:', nullifierProof.pub_signals);
      logger.error('Nullifier extraction failed', {
        sessionId,
        circuitId: nullifierProof.circuitId,
        signalCount: nullifierProof.pub_signals?.length
      });

      return res.status(400).json({
        error: "Invalid proof structure",
        details: "Could not extract nullifier from proof signals"
      });
    }

    console.log(`✅ Nullifier extracted successfully`);
    console.log(`   Hash (first 30 chars): ${nullifierHash.substring(0, 30)}...`);
    console.log(`   Full length: ${nullifierHash.length} characters`);

    // Import database service
    const dbService = require('./services/db-service');

    // [GATEKEEPER] Check if this nullifier has already been used (Replay Attack Detection)
    console.log('\n🛡️  Performing anti-replay check...');
    const isReplay = await dbService.isUserVerified(nullifierHash);

    if (isReplay) {
      console.error('\n🚨 === REPLAY ATTACK BLOCKED ===');
      console.error('   Nullifier:', nullifierHash.substring(0, 30) + '...');
      console.error('   Session ID:', sessionId);
      console.error('   This identity has already verified.');

      logger.logSecurityEvent('REPLAY_ATTACK_BLOCKED', {
        nullifierHash: nullifierHash.substring(0, 20) + '...',
        sessionId,
        timestamp: new Date().toISOString()
      }, 'warn');

      return res.status(400).json({
        error: "Already Verified",
        details: "This identity has already been used for verification. Each user can only verify once."
      });
    }

    console.log('✅ Anti-replay check passed: This is a new user');

    // [THE LOCK] Store the nullifier to prevent future reuse
    console.log('\n💾 Storing nullifier in database...');
    try {
      await dbService.setUserVerification(nullifierHash, sessionId);
      console.log('✅ Nullifier stored successfully - Future replays will be blocked');
    } catch (dbError) {
      console.error('\n❌ CRITICAL: Failed to store nullifier in database!');
      console.error('   Error:', dbError.message);
      console.error('   This could allow replay attacks if not resolved.');

      logger.error('Database storage failed', {
        error: dbError.message,
        nullifierHash: nullifierHash.substring(0, 20) + '...',
        sessionId
      });

      // Decision: Should we still allow the verification if DB save fails?
      // Option 1: Fail the request (safer but could impact user experience)
      // Option 2: Allow it but log critical error (current implementation)
      // For production, consider Option 1 for maximum security
    }

    console.log('\n🎉 === VERIFICATION SUCCESSFUL ===\n');

    // =========================================================================
    // END NULLIFIER LOGIC
    // =========================================================================

    // Update verification status to success
    const proofRequestId = authRequest.body.scope.find(s => s.circuitId === "credentialAtomicQueryV3-beta.1")?.id;
    if (proofRequestId) {
      await redisService.setVerificationStatus(proofRequestId, "success");
    }

    logger.logVerification(sessionId, 'success', authResponse.from);
    logger.logRequest(req, res, Date.now() - startTime);

    return res
      .status(200)
      .set("Content-Type", "application/json")
      .send(authResponse);

  } catch (error) {
    logger.error("Error in /api/callback", { error: error.message, stack: error.stack, sessionId });

    // Handle verification-specific errors differently
    if (error.message && error.message.includes('verification')) {
      return res.status(400).json({
        error: "Verification failed",
        details: process.env.NODE_ENV === 'development' ? error.message : "Authentication verification failed"
      });
    }

    // Generic server error response
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validate required environment variables
function validateEnvironment() {
  const required = [
    'USE_CASE',
    'VERIFIER_DID',
    'NULLIFIER_SESSION_ID',
    'HOST_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_USERNAME',
    'REDIS_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate USE_CASE value
  const validUseCases = ['POH', 'POU', 'POVH'];
  if (!validUseCases.includes(process.env.USE_CASE?.toUpperCase())) {
    throw new Error(`Invalid USE_CASE: ${process.env.USE_CASE}. Must be one of: ${validUseCases.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(process.env.HOST_URL);
  } catch {
    throw new Error(`Invalid HOST_URL: ${process.env.HOST_URL}. Must be a valid URL.`);
  }

  // Validate Redis port
  const port = parseInt(process.env.REDIS_PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid REDIS_PORT: ${process.env.REDIS_PORT}. Must be a number between 1-65535.`);
  }

  logger.info('Environment validation passed', {
    useCase: process.env.USE_CASE,
    nodeEnv: process.env.NODE_ENV
  });
}

// Initialize Redis connection and start the Express server
async function startServer() {
  try {
    // Validate environment variables first
    validateEnvironment();

    // Validate production configuration
    if (process.env.NODE_ENV === 'production') {
      const origins = process.env.ALLOWED_ORIGINS || '';
      if (origins.includes('your-production-domain.com') || origins.includes('your-app-domain.com')) {
        logger.logSecurityEvent('PRODUCTION_CONFIG_WARNING', {
          message: 'Using placeholder domains in production CORS configuration',
          allowedOrigins: origins,
          recommendation: 'Update ALLOWED_ORIGINS environment variable with real domains'
        }, 'error');
      }

      // Check for placeholder credentials in production
      if (process.env.REDIS_PASSWORD?.includes('your-secure-redis-password-here')) {
        logger.logSecurityEvent('PRODUCTION_SECURITY_WARNING', {
          message: 'Using placeholder Redis credentials in production',
          recommendation: 'Update Redis credentials with real values'
        }, 'error');
      }
    }

    // Attempt Redis connection but don't fail startup if unavailable
    try {
      await redisService.connect();
      logger.info('Redis connected successfully');
    } catch (redisError) {
      logger.warn('Redis connection failed at startup, running in degraded mode', {
        error: redisError.message
      });
      // Server will still start but with degraded functionality
    }

    const server = app.listen(port, () => {
      logger.info('Server started successfully', {
        port,
        useCase: USE_CASE,
        config: currentConfig.name,
        nodeEnv: process.env.NODE_ENV,
        corsMode: process.env.NODE_ENV === 'production' ? 'restricted' : 'permissive',
        allowedOrigins: process.env.NODE_ENV === 'production' ? allowedOrigins.length : 'localhost',
        redisConnected: redisService.isHealthy()
      });
    });
    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start the application
(async () => {
  const server = await startServer();
})();

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  server.close(async () => {
    logger.info('HTTP server closed');
    await redisService.disconnect();
    logger.info('Process terminated gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  server.close(async () => {
    logger.info('HTTP server closed');
    await redisService.disconnect();
    logger.info('Process terminated gracefully');
    process.exit(0);
  });
});

