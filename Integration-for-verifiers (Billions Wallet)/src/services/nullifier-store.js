const { Mutex } = require('async-mutex');

const nullifierMutex = new Mutex();
const claimedNullifiers = new Set();

module.exports = {
    async claimNullifier(nullifierHash) {
        const release = await nullifierMutex.acquire();
        try {
            if (claimedNullifiers.has(nullifierHash)) {
                return { claimed: false };
            }
            claimedNullifiers.add(nullifierHash);
            return { claimed: true };
        } finally {
            release();
        }
    }
};
