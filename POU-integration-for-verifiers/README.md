# Verifier Backend Example for POU verifications

This project is a demo backend and static UI for Privado Proof of Uniqueness (POU) verification. It allows you to generate verification requests and verify zero-knowledge proofs from wallets using the Privado protocol.

## Quick Start

1. **Install dependencies**

   ```bash
   cd POU-integration/js
   npm install
   ```

2. **Configure environment variables**

   - Copy the provided `.env` template to `POU-integration/js/.env` and fill in your values.

3. **Start the backend server**

   ```bash
   node index.js
   ```

   The server will run on the port specified in your `.env` file (default: 8080).

4. **Access the demo UI**

   - Open your browser and go to: [http://localhost:8080](http://localhost:8080)
   - You will see a call-to-action button that demonstrates how to integrate Privado verification into your own site.



## License

MIT

## Contact

For support or integration help, contact [Privado](https://privado.id) or open an issue in this repository. 
