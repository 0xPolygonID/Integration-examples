# Billions Wallet Verification Integration Example

This project is a demo backend and static UI for integrating verifications via Billions Wallet. It allows you to generate verification requests and verify zero-knowledge proofs from the wallet. 

## 📋 Supported Verification Types

- **POH (Proof of Humanity)**: Verify users are real humans via `Human` credential
- **POU (Proof of Uniqueness)**: Verify user uniqueness via `Verified Human` credential

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
2. **Download the Billions app** using the provided links
3. **Scan the QR code** with the Billions mobile app
4. **Complete verification** in the app
5. **See status update** on the web page


---

**Ready to integrate Billions verification into your application? Start with this example and customize it for your needs!** 🚀

## License
MIT


