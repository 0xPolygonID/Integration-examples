const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for most cloud DBs
});

// Log connection status
pool.on('connect', () => {
    console.log('✅ PostgreSQL pool connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err);
});

module.exports = {
    // Check if user exists (Anti-Replay Check)
    async isUserVerified(nullifierHash) {
        console.log(`🔍 Checking if nullifier exists in database: ${nullifierHash.substring(0, 20)}...`);

        try {
            const res = await pool.query(
                'SELECT * FROM verified_nullifiers WHERE hash = $1',
                [nullifierHash]
            );

            const isVerified = res.rows.length > 0;

            if (isVerified) {
                console.log(`⚠️  REPLAY DETECTED: Nullifier already exists in database`);
                console.log(`   Hash: ${nullifierHash.substring(0, 20)}...`);
                console.log(`   Original verification: ${res.rows[0].timestamp}`);
            } else {
                console.log(`✅ Nullifier NOT FOUND in database (New user)`);
            }

            return isVerified;
        } catch (err) {
            console.error('❌ Database Query Error (isUserVerified):', err.message);
            console.error('   Stack:', err.stack);
            console.error('   Nullifier Hash:', nullifierHash);
            return false; // Fail safe - allow verification on DB error
        }
    },

    // Save the user verification
    async setUserVerification(nullifierHash, sessionId) {
        console.log(`💾 Attempting to store nullifier in database...`);
        console.log(`   Hash: ${nullifierHash.substring(0, 20)}...`);
        console.log(`   Session ID: ${sessionId}`);

        try {
            await pool.query(
                'INSERT INTO verified_nullifiers (hash, session_id) VALUES ($1, $2)',
                [nullifierHash, sessionId]
            );

            console.log(`✅ SUCCESS: Nullifier permanently stored in database`);
            console.log(`   This user cannot verify again with this nullifier`);
            return true;
        } catch (err) {
            console.error('❌ Database Insert Error (setUserVerification):', err.message);
            console.error('   Code:', err.code);
            console.error('   Detail:', err.detail);
            console.error('   Stack:', err.stack);

            // Check if it's a duplicate key error
            if (err.code === '23505') {
                console.error('   DUPLICATE KEY: This nullifier already exists!');
            }

            throw err;
        }
    },

    // Health check for database connection
    async healthCheck() {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('✅ Database health check passed:', res.rows[0].now);
            return true;
        } catch (err) {
            console.error('❌ Database health check failed:', err.message);
            return false;
        }
    }
};