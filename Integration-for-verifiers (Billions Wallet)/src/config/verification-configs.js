/**
 * Verification Configurations for Different Use Cases
 * 
 * This file contains all the credential verification configurations.
 * Simply change the USE_CASE to switch between different verification types.
 */

const VERIFICATION_CONFIGS = {
  // Proof of Humanity Configuration
  POH: {
    name: "Human Credential",
    verification_description: "Verify you are a human",
    circuitId: "credentialAtomicQueryV3-beta.1",
    query: {
      allowedIssuers: [
        "did:iden3:billions:main:2VmnvBNtpxCUbiEH3R2DNuXqPxuaBQJsG6mwU1J8PD"
      ],
      context: "ipfs://QmcomGJQwJDCg3RE6FjsFYCjjMSTWJXY3fUWeq43Mc5CCJ",
      type: "LivenessCredential"
    }
  },

  // Proof of Verified Humanity Configuration
  POVH: {
    name: "Verified Human Credential",
    verification_description: "Verify you are a verified human",
    circuitId: "credentialAtomicQueryV3-beta.1",
    query: {
      allowedIssuers: [
        "did:iden3:billions:test:2VxnoiNqdMPxzqp7X6MV7GfoPkDZ7ij499mDZAo72y",
        "did:iden3:billions:test:2VxnoiNqdMPyMXmEKpP8wGqrY6Vb7mgeQQUywyVeWe"
      ],
      context: "ipfs://QmZbsTnRwtCmbdg3r9o7Txid37LmvPcvmzVi1Abvqu1WKL",
      type: "BasicPerson"
    }
  },

  // Proof of Uniqueness
  POU: {
    name: "Uniqueness Credential",
    verification_description: "Verify you are a unique human",
    circuitId: "credentialAtomicQueryV3-beta.1",
    query: {
      allowedIssuers: [
        "did:iden3:billions:main:2VmnvBNtpxCUbiEH3R2DNuXqPxuaBQJsG6mwU1J8PD",
      ],
      context: "ipfs://QmcUEDa42Er4nfNFmGQVjiNYFaik6kvNQjfTeBrdSx83At",
      type: "UniquenessCredential"
    }
  }
};

/**
 * Get configuration for a specific use case
 * @param {string} useCase - The use case key (e.g., 'POU', 'KYC', 'AGE_VERIFICATION')
 * @returns {Object} Configuration object for the specified use case
 */
function getConfig(useCase) {
  const config = VERIFICATION_CONFIGS[useCase.toUpperCase()];
  
  if (!config) {
    const available = Object.keys(VERIFICATION_CONFIGS).join(', ');
    throw new Error(`Unknown verification use case: ${useCase}. Available options: ${available}`);
  }
  
  return {
    ...config,
    useCase: useCase.toUpperCase()
  };
}

/**
 * Create a proof request for a specific use case
 * @param {string} useCase - The use case key
 * @param {number} sessionId - Session ID for the request
 * @param {string} nullifier - Nullifier for the session
 * @returns {Object} Proof request object
 */
function createProofRequest(useCase, sessionId, nullifier) {
  const config = getConfig(useCase);
  
  return {
    circuitId: config.circuitId,
    id: sessionId,
    params: {
      nullifierSessionId: nullifier.toString()
    },
    query: config.query
  };
}

/**
 * Get all available use cases
 * @returns {Array} Array of available use case keys
 */
function getAvailableUseCases() {
  return Object.keys(VERIFICATION_CONFIGS);
}

module.exports = {
  VERIFICATION_CONFIGS,
  getConfig,
  createProofRequest,
  getAvailableUseCases
};
