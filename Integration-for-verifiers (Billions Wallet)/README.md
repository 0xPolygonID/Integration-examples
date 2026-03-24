# Billions Wallet Verification Integration Example

This project is a demo backend and static UI for integrating verifications via Billions Wallet. It allows you to generate verification requests and verify zero-knowledge proofs from the wallet. 

## 📋 Supported Verification Types

- **POH (Proof of Humanity)**: Verify users are real humans via `Human` credential
- **POU (Proof of Uniqueness)**: Verify user uniqueness via `Uniqueness` credential
- **POVH (Proof of Verified Humaity)** Verify that users are `Verified human` via Verified Human (passport/Aadhaar) cred
## Quick Start

1. **Install dependencies**

```bash
cd "Integration-for-verifiers (Billions Wallet)/js"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on the env.example in the `js/` directory with the following variables:

```

### 3. Set Up Public Access

The Billions mobile app sends callbacks to your server, so you need public access. Use tools like:
- ngrok
- localtunnel


### 4. Start the Server

```bash
node index.js
```

You should see:
```
🚀 Privado verifier backend running on port 8080
🔧 Using verification configuration: POU (Verified Human)
```

### 5. Test the Integration

1. **Open your browser** to `http://localhost:8080`
2. **Reload** the page to start a session and invoke verification request.
2. **Click** the button to continue flow on Billions Web Wallet or **Scan the QR after downloading the APP** to continue the flow on the native app.
4. **Complete verification** in the app
5. **See status update** on the web page


---

**Ready to integrate Billions verification into your application? Start with this example and customize it for your needs!** 🚀

---

## Going Production-Ready

This example uses in-memory maps for sessions, status, and nullifier tracking. These are lost on restart and cannot be shared across multiple server instances. Below is guidance on what to replace them with.

### Sessions and status — use Redis

`requestMap` and `statusMap` hold short-lived data tied to a single verification flow. Redis is a natural fit: it supports TTL-based expiry, is fast, and works across multiple server instances.

Use the `ioredis` npm package to connect. Store session and status keys with a TTL (e.g. 10 minutes) so stale entries are cleaned up automatically.

### Nullifier replay protection — use a relational database

`userVerificationMap` must be **permanent**. A nullifier that has been claimed must stay claimed forever, even across restarts and deployments.

Use PostgreSQL (or any relational DB) with a `verified_nullifiers` table where `nullifier` is the primary key. Replace the in-process mutex with a database-level atomic upsert (`INSERT ... ON CONFLICT DO NOTHING`) — this is safe across multiple server instances and removes the need for the mutex entirely.

### Deployment

Run the verifier, Redis, and PostgreSQL as separate services — Docker Compose works well for this. Connect them via environment variables (`REDIS_URL`, `DATABASE_URL`).

### Checklist before going to production

- [ ] Replace `requestMap` / `statusMap` with Redis (with TTL)
- [ ] Replace `userVerificationMap` with a database table
- [ ] Set `CORS` origin to your actual frontend domain (not `*`)
- [ ] Use HTTPS (terminate TLS at a load balancer or reverse proxy)
- [ ] Run behind a process manager (`pm2`) or container orchestrator
- [ ] Set `NODE_ENV=production`
- [ ] Store all secrets in environment variables, never in code
- [ ] Add database connection pooling and error handling

---

## License
MIT


