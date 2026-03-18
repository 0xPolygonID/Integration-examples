const authRequests = new Map();
const verificationStatuses = new Map();

module.exports = {
    setAuthRequest(sessionId, authRequest) {
        authRequests.set(sessionId, authRequest);
        return true;
    },

    getAuthRequest(sessionId) {
        return authRequests.get(sessionId) || null;
    },

    setVerificationStatus(requestId, status) {
        verificationStatuses.set(requestId, status);
        return true;
    },

    getVerificationStatus(requestId) {
        return verificationStatuses.get(requestId) || null;
    }
};
