const VERIFICATION_CONFIGS = {
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

function getConfig(useCase) {
  const config = VERIFICATION_CONFIGS[useCase.toUpperCase()];
  if (!config) {
    throw new Error(`Unknown use case: ${useCase}. Available: ${Object.keys(VERIFICATION_CONFIGS).join(', ')}`);
  }
  return { ...config, useCase: useCase.toUpperCase() };
}

function createProofRequest(useCase, sessionId, nullifier) {
  const config = getConfig(useCase);
  return {
    circuitId: config.circuitId,
    id: sessionId,
    params: { nullifierSessionId: nullifier.toString() },
    query: config.query
  };
}

module.exports = {
  VERIFICATION_CONFIGS,
  getConfig,
  createProofRequest,
  getAvailableUseCases: () => Object.keys(VERIFICATION_CONFIGS)
};
