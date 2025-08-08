/**
 * Privado Verifier Backend
 *
 * This Express server implements the Privado verification flow using iden3.
 *
 * Endpoints:
 * - GET  /api/verification-request: Generates a verification request and returns a universal link for the wallet.
 * - POST /api/callback: Verifies the proof sent by the client and prevents replay attacks.
 *
 * NOTE: This implementation uses in-memory storage for sessions and verifications.
 *       For production, use a persistent store (e.g., Redis) for scalability and reliability.
 */

require('dotenv').config();
const path = require("path");
const express = require("express");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { auth, resolver } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { CircuitId, AtomicQueryV3PubSignals } = require('@0xpolygonid/js-sdk');
const { randomInt } = require('crypto');

// Import configuration system
const { getConfig, createProofRequest } = require('./config/verification-configs');

const app = express();
const port = process.env.PORT || 8080;
const byteEncoder = new TextEncoder();


const USE_CASE = process.env.USE_CASE;
const nullifierSessionID = process.env.NULLIFIER_SESSION_ID; 

// Get the configuration for the selected use case
const currentConfig = getConfig(USE_CASE);


// Security middlewares
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

app.use(cors({
  origin: '*', // Set to your frontend domain in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 })); // 100 requests/minute

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., QR code page)
app.use(express.static("../static"));

// In-memory maps for session and user verification
const requestMap = new Map(); // sessionId -> authRequest
const userVerificationMap = new Map(); // userDid -> { sessionId, verified }
const statusMap = new Map(); // requestId -> status



/**
 * GET /api/verification-request
 * Generates a verification request and returns a universal link for the wallet.
 */
app.get("/api/verification-request", async (req, res) => {
  console.log(`/verification-request called`)
  try {
    
    const hostUrl = process.env.HOST_URL; //host url to this verifier
    const sessionId = randomInt(10000)
    const callbackURL = "/api/callback";

    if (!hostUrl) {
      console.log("Server misconfiguration: HOST_URL is missing")
    }

    if (!process.env.VERIFIER_DID) {
      console.log("Server misconfiguration: VERIFIER_DID is missing");
    }


    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

    // Generate request for basic authentication using config
    const request = auth.createAuthorizationRequest(
      currentConfig.verification_description, 
      process.env.VERIFIER_DID, 
      uri
    );

    // Create proof request using the current configuration
    const proofRequest = createProofRequest(USE_CASE, sessionId, nullifierSessionID);

    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Store auth request in map associated with session ID
    requestMap.set(sessionId, request);

    // Initialize status as pending
    statusMap.set(proofRequest.id, "pending");

    return res.status(200).json(request);
  } catch (err) {
    console.error("Error in /api/verification-request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/status/:id
 * Returns the verification status for a given request ID.
 */
app.get("/api/status/:id", (req, res) => {
  const requestId = parseInt(req.params.id);
  const status = statusMap.get(requestId) || "not_found";

  return res.status(200).json({
    requestId: requestId,
    status: status,
  });
});

/**
 * POST /api/callback
 * Verifies the proof after sign-in callback.
 * Prevents replay attacks by ensuring a userDid can only verify once.
 */
app.post("/api/callback", async (req, res) => {
  console.log("/callback called")
  const sessionId = parseInt(req.query.sessionId);
  if (isNaN(sessionId)) {
    return res.status(400).json({ message: "Invalid sessionId format" });
  }

  // Get JWZ token params from the post request
  const raw = await getRawBody(req);
  const tokenStr = raw.toString().trim();


  // Fetch authRequest from sessionID
  const authRequest = requestMap.get(sessionId);
  if (!authRequest) {
    return res.status(400).json({ message: "Invalid or expired sessionId" });
  }

  // Set up resolvers for supported networks
  const resolvers = {
    ["billions:main"]: new resolver.EthStateResolver(
      "https://rpc-mainnet.billions.network/",
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

  // Execute verification
  const verifier = await auth.Verifier.newVerifier({
    stateResolver: resolvers,
    circuitsDir: path.join(__dirname, "../keys"),
    ipfsGatewayURL: "https://ipfs.io",
  });

  let authResponse;
  try {
    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
    };
    authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
  
     // Prevent replay attack: check if this user's nullifier is already verified
     const nullifierProof = authResponse.body.scope.find(
      (s) => s.circuitId === "credentialAtomicQueryV3-beta.1" && s.id === sessionId
    );
    if (!nullifierProof) {
      return res.status(400).json({ message: "No valid nullifier proof found in response." });
    }

    const pubSignals = new AtomicQueryV3PubSignals().pubSignalsUnmarshal(
      byteEncoder.encode(JSON.stringify(nullifierProof.pub_signals))
    );

    const nullifier = pubSignals.nullifier;

    if (userVerificationMap.has(nullifier) && userVerificationMap.get(nullifier).verified) {
      return res.status(400).json({ message: "User with this did has been verified already." });
    }
  
    userVerificationMap.set(nullifier, {
      sessionId: sessionId,
      verified: true,
    });
    
    // Update status to success after successful verification
    // Get the proof request ID from the authRequest
    const proofRequestId = authRequest.body.scope.find(s => s.circuitId === "credentialAtomicQueryV3-beta.1")?.id;
    if (proofRequestId) {
      statusMap.set(proofRequestId, "success");
    }

    console.log(`✅ User ${authResponse.from} successfully verified for ${USE_CASE} (${currentConfig.name})`);  
    
  } catch (error) {
    console.error("Error in /api/callback:", error);
    return res.status(500).send(error.message);
  }
  return res
    .status(200)
    .set("Content-Type", "application/json")
    .send(authResponse);
});

// Start the server
const server = app.listen(port, () => {
  console.log(`🚀 Privado verifier backend running on port ${port}`);
  console.log(`🔧 Using verification configuration: ${USE_CASE} (${currentConfig.name})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});

/**
 * NOTE:
 * - For production, use HTTPS and a process manager (e.g., pm2).
 * - Replace in-memory maps with a persistent store.
 * - Set all secrets and config in environment variables.
 * - Monitor and log errors for auditing and debugging.
 */

