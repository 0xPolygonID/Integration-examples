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

const app = express();
const port = process.env.PORT || 8080;

const byteEncoder = new TextEncoder();

// Security middleware
app.use(helmet());
app.use(cors({
  origin:'*', // Set to your frontend domain in production
}));
app.use(rateLimit({ windowMs: 1 * 60 * 1000, max: 100 })); // 100 requests/minute

// Serve static files (e.g., QR code page)
app.use(express.static("../static"));

// In-memory maps for session and user verification
const requestMap = new Map(); // sessionId -> authRequest
const userVerificationMap = new Map(); // userDid -> { sessionId, verified, nullifier }

// The nullifier must be a positive BigInt for the proof request.
// Here, we use the first 16 hex digits of a UUIDv4 as a random positive BigInt.
const nullifier = BigInt('0x' + uuidv4().replace(/-/g, '').slice(0, 16));

/**
 * GET /api/verification-request
 * Generates a verification request and returns a universal link for the wallet.
 */
app.get("/api/verification-request", async (req, res) => {
  console.log("/verification-request called")
  try {
    
    const hostUrl = process.env.HOST_URL; //host url to this verifier
    const sessionId = uuidv4();
    const callbackURL = "/api/callback";
    const audience = process.env.AUDIENCE_DID;  // Audience is the verifier's DID

    if (!hostUrl || !audience) {
      return res.status(500).json({ error: "Server misconfiguration: HOST_URL or AUDIENCE_DID missing" });
    }

    const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;

    // Generate request for basic authentication
    const request = auth.createAuthorizationRequest("Verification of Uniqueness", audience, uri);

    // Add request for a specific proof
    const proofRequest = {
      "circuitId": "credentialAtomicQueryV3-beta.1",
      "id": 1,
      "params": {
        // Must be a stringified positive BigInt
        "nullifierSessionId": nullifier.toString()
      },
      "query": {
        "allowedIssuers": [
          process.env.ALLOWED_ISSUER
        ],
        "context":"ipfs://QmcUEDa42Er4nfNFmGQVjiNYFaik6kvNQjfTeBrdSx83At",
        "type": "UniquenessCredential"
      }
    };
    const scope = request.body.scope ?? [];
    request.body.scope = [...scope, proofRequest];

    // Store auth request in map associated with session ID
    requestMap.set(sessionId, request);

    return res.status(200).json(request);
  } catch (err) {
    console.error("Error in /api/verification-request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/callback
 * Verifies the proof after sign-in callback.
 * Prevents replay attacks by ensuring a userDid can only verify once.
 */
app.post("/api/callback", async (req, res) => {
  console.log("/callback called")

  // Validate sessionId
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  // Get JWZ token params from the post request
  const raw = await getRawBody(req);
  const tokenStr = raw.toString().trim();

  // Fetch authRequest from sessionID
  const authRequest = requestMap.get(sessionId);
  if (!authRequest) {
    return res.status(400).json({ error: "Invalid or expired sessionId" });
  }

  // Set up resolvers for supported networks
  const resolvers = {
    ["billions:main"]: new resolver.EthStateResolver(
      process.env.BILLIONS_RPC_URL,
      process.env.BILLIONS_CONTRACT
    ),
    ["privado:main"]: new resolver.EthStateResolver(
      process.env.PRIVADO_RPC_URL,
      process.env.PRIVADO_CONTRACT
    )
  };

  // Execute verification
  const verifier = await auth.Verifier.newVerifier({
    stateResolver: resolvers,
    circuitsDir: path.join(__dirname, process.env.KEY_DIR || "../keys"),
    ipfsGatewayURL: process.env.IPFS_GATEWAY || "https://ipfs.io",
  });

  let authResponse;
  try {
    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minute
    };
    authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);

    // Find the nullifier proof in the response
    const nullifierProof = authResponse.body.scope.find(
      (s) => s.circuitId === CircuitId.AtomicQueryV3
    );

    if (!nullifierProof) {
      return res.status(400).json({ error: "No valid nullifier proof found in response." });
    }

    // Parse public signals from the proof
    const pubSignals = new AtomicQueryV3PubSignals().pubSignalsUnmarshal(
      byteEncoder.encode(JSON.stringify(nullifierProof.pub_signals))
    );


    // logic to prevent replay attack using nullifier

    // Extract user identifier and nullifier
    const userIdentifier = authResponse.from;
    const nullifier = pubSignals.nullifier;

    // Check and store verification info in a map
    if (userVerificationMap.has(userIdentifier)) {
      const existing = userVerificationMap.get(userIdentifier);
      if (existing.nullifier === nullifier) {
        return res.status(400).json({message: "User already registered with the same nullifier." });
      } else {
        return res.status(400).json({ message: "Incorrect nullifier for the given user." });
      }
    } else {
      userVerificationMap.set(userIdentifier, {
        sessionId: sessionId,
        verified: true,
        nullifier: nullifier
      });
      console.log(`User ${userIdentifier} is verified successfully`);
    }

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
  console.log(`Privado verifier backend running on port ${port}`);
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

