# Billions Wallet Verification Integration Example

This project is a demo backend and static UI for integrating verifications via Billions Wallet. It allows you to generate verification requests and verify zero-knowledge proofs from the wallet. 

## 📋 Supported Verification Types

- **POH (Proof of Humanity)**: Verify users are real humans via `Human` credential
- **POU (Proof of Uniqueness)**: Verify user uniqueness via `Uniqueness` credential
- **POVH (Proof of Verified Humaity)** Verify that users are `Verified human` via Verified Human (passport/Aadhaar) cred
## Quick Start

1. **Install dependencies**

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on the `env.example` in the directory:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```bash
# Server Configuration
PORT=8080
HOST_URL=https://your-domain.com  # Your production domain or ngrok URL for development

# Verifier Configuration  
#⚠️  CRITICAL: IMMUTABLE VALUES - DO NOT CHANGE AFTER FIRST USE (NULLIFIER_ID & VERIFIER_DID)
# These values CANNOT be changed once users start verifying, as changing them
# will result in different nullifier IDs and DIDs for the same users.
VERIFIER_DID=your_verifier_did_here # Download the Billions app and Login into it.Copy the DID created for your account to use as the Verifier. You can find that in settings.
USE_CASE=POU  # Options: POH, POU, POVH
NULLIFIER_SESSION_ID=your_nullifier_session_id # Must be a positive BigInt for the proof request.

#Use case selection
# POH (Proof of Humanity): Verify that the user is a real human via `Human` Credential
# POU (Proof of Uniqueness): Verify that the user is unique (anti-Sybil) via `Verified Human` credential
# POVH (Proof of Verified Humanity): Verify that the user is a real verified human via `Verified Human` Credential

USE_CASE=POVH    #Options: 'POH', 'POU'

# Redis Configuration (Production)
# ⚠️ SECURITY: Never commit real credentials to code repositories
REDIS_HOST=your-redis-host.redis-cloud.com
REDIS_PORT=12345
REDIS_USERNAME=your-redis-username
REDIS_PASSWORD=your-secure-redis-password-here

# Security Configuration (Production)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-mobile-app-domain.com  # Comma-separated list
NODE_ENV=production  # Set to 'production' for strict CORS
LOG_LEVEL=info  # Options: error, warn, info, debug
```

### 3. Set Up Public Access

The Billions mobile app sends callbacks to your server, so you need public access. Use tools like:
- ngrok
- localtunnel


### 4. Start the Server

To start ans test the server in dev mode use:
```bash
npm run pm2:dev
```

You should see a series of messages from PM2 indicating that it’s launching multiple instances of the backend in cluster mode. This confirms that your Billions Verifier backend has successfully started under PM2, leveraging multiple workers for scalability and fault tolerance.

### 5. Test the Integration

1. **Open your browser** to `http://localhost:8080`
2. **Check health status** at `http://localhost:8080/api/health` to verify Redis connection
3. **Reload** the page to start a session and invoke verification request.
4. **Click** the button to continue flow on Billions Web Wallet or **Scan the QR after downloading the APP** to continue the flow on the native app.
5. **Complete verification** in the app
6. **See status update** on the web page

### 6. Production Features

This implementation includes production-ready features:

- **Redis Storage**: Persistent storage for sessions and verifications
- **PM2**: Process Manager for Node.js applications with a built-in Load Balancer.
- Use a permament storage for sessions and verifications relared to uniquness and nullifier id.
- **Health Check**: `/api/health` endpoint for monitoring
- **Graceful Shutdown**: Proper cleanup of Redis connections
- **Error Handling**: Comprehensive error handling for Redis operations
- **TTL Management**: Automatic expiration of stored data
- **Security**: Rate limiting, CORS, and security headers


---



