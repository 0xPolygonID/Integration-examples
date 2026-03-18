const { Pool } = require('pg');
const { Mutex } = require('async-mutex');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});

const nullifierMutex = new Mutex();

module.exports = {
    async claimNullifier(nullifierHash, sessionId) {
        const release = await nullifierMutex.acquire();
        try {
            const existing = await pool.query(
                'SELECT 1 FROM verified_nullifiers WHERE hash = $1',
                [nullifierHash]
            );

            if (existing.rows.length > 0) {
                return { claimed: false };
            }

            await pool.query(
                'INSERT INTO verified_nullifiers (hash, session_id) VALUES ($1, $2)',
                [nullifierHash, sessionId]
            );

            return { claimed: true };
        } finally {
            release();
        }
    },

    async healthCheck() {
        try {
            await pool.query('SELECT NOW()');
            return true;
        } catch {
            return false;
        }
    }
};
