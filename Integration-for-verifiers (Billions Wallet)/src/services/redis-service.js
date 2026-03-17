const { createClient } = require('redis');

// Redis service for session management and verification storage
// Provides production-ready persistent storage with circuit breaker and in-memory fallback
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.circuitBreakerFailures = 0;
    this.circuitBreakerThreshold = 5;
    this.circuitBreakerOpen = false;
    this.circuitBreakerResetTime = 60000; // 1 minute
    this.lastCircuitBreakerOpen = null;

    // In-memory fallback cache
    this.memoryCache = new Map();
    this.maxCacheSize = 10000; // Limit memory usage
    this.cacheCleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.initializeMemoryCache();
  }

  // Establish connection to Redis server
  async connect() {
    try {
      // Create Redis client with environment configuration
      this.client = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        }
      });

      // Set up connection event handlers with recovery mechanisms
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
        this.handleConnectionFailure();
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.resetCircuitBreaker();
      });

      this.client.on('disconnect', () => {
        console.log('❌ Redis disconnected');
        this.isConnected = false;
        this.scheduleReconnection();
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      await this.client.ping();
      console.log('✅ Redis connection established and tested');

    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      this.handleConnectionFailure();
      throw error;
    }
  }

  // Gracefully disconnect from Redis
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected gracefully');
    }
  }

  // Handle connection failures with circuit breaker
  handleConnectionFailure() {
    this.circuitBreakerFailures++;

    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.openCircuitBreaker();
    }
  }

  // Open circuit breaker to prevent cascading failures
  openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    this.lastCircuitBreakerOpen = Date.now();
    console.log(`⚡ Circuit breaker opened after ${this.circuitBreakerFailures} failures`);

    // Schedule circuit breaker reset
    setTimeout(() => {
      this.resetCircuitBreaker();
    }, this.circuitBreakerResetTime);
  }

  // Reset circuit breaker for retry attempts
  resetCircuitBreaker() {
    if (this.circuitBreakerOpen) {
      console.log('🔄 Circuit breaker reset - allowing new attempts');
    }
    this.circuitBreakerOpen = false;
    this.circuitBreakerFailures = 0;
    this.lastCircuitBreakerOpen = null;
  }

  // Schedule reconnection with exponential backoff
  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`⏰ Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
      }
    }, delay);
  }

  // Initialize memory cache with cleanup
  initializeMemoryCache() {
    // Periodic cleanup of expired entries
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cacheCleanupInterval);

    console.log('🧠 In-memory fallback cache initialized');
  }

  // Clean up expired entries from memory cache
  cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired entries from memory cache`);
    }
  }

  // Set value in memory cache with TTL
  setMemoryCache(key, value, ttl = 3600) {
    // Enforce cache size limit
    if (this.memoryCache.size >= this.maxCacheSize) {
      // Remove oldest entry (LRU-like behavior)
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    const expiresAt = ttl > 0 ? Date.now() + (ttl * 1000) : null;
    this.memoryCache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });

    console.log(`🧠 Stored in memory cache: ${key} (TTL: ${ttl}s)`);
  }

  // Get value from memory cache
  getMemoryCache(key) {
    const entry = this.memoryCache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    console.log(`🧠 Retrieved from memory cache: ${key}`);
    return entry.value;
  }

  // Execute Redis operation with in-memory fallback
  async executeWithFallback(operation, fallbackKey = null, fallbackValue = null) {
    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      console.log('⚡ Circuit breaker open, using memory cache');
      return fallbackKey ? this.getMemoryCache(fallbackKey) : fallbackValue;
    }

    // Check connection
    if (!this.isConnected || !this.client) {
      console.log('⚠️ Redis not connected, using memory cache');
      return fallbackKey ? this.getMemoryCache(fallbackKey) : fallbackValue;
    }

    try {
      const result = await operation();
      // Reset failure count on successful operation
      this.circuitBreakerFailures = Math.max(0, this.circuitBreakerFailures - 1);
      return result;
    } catch (error) {
      console.error('❌ Redis operation failed, using memory cache:', error);
      this.handleConnectionFailure();
      return fallbackKey ? this.getMemoryCache(fallbackKey) : fallbackValue;
    }
  }

  // Store authentication request with TTL (default: 1 hour)
  async setAuthRequest(sessionId, authRequest, ttl = 3600) {
    const key = `auth_request:${sessionId}`;

    // Always store in memory cache as backup
    this.setMemoryCache(key, authRequest, ttl);

    return await this.executeWithFallback(async () => {
      await this.client.setEx(key, ttl, JSON.stringify(authRequest));
      console.log(`✅ Auth request stored in Redis for session ${sessionId}`);
      return true;
    }, null, true); // Return true even if Redis fails (stored in memory)
  }

  // Retrieve authentication request by session ID
  async getAuthRequest(sessionId) {
    const key = `auth_request:${sessionId}`;

    return await this.executeWithFallback(async () => {
      const result = await this.client.get(key);
      const authRequest = result ? JSON.parse(result) : null;

      // Update memory cache if found in Redis
      if (authRequest) {
        this.setMemoryCache(key, authRequest, 3600);
      }

      return authRequest;
    }, key, null); // Fallback to memory cache using key
  }

  // Remove authentication request from storage
  async deleteAuthRequest(sessionId) {
    try {
      const key = `auth_request:${sessionId}`;
      await this.client.del(key);
      console.log(`✅ Auth request deleted for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to delete auth request for session ${sessionId}:`, error);
    }
  }

  // Store user verification data with TTL (default: 24 hours)
  async setUserVerification(nullifier, verificationData, ttl = 86400) {
    try {
      const key = `user_verification:${nullifier}`;
      await this.client.setEx(key, ttl, JSON.stringify(verificationData));
      console.log(`✅ User verification stored for nullifier ${nullifier}`);
    } catch (error) {
      console.error(`❌ Failed to store user verification for nullifier ${nullifier}:`, error);
      throw error;
    }
  }

  // Retrieve user verification data by nullifier
  async getUserVerification(nullifier) {
    try {
      const key = `user_verification:${nullifier}`;
      const result = await this.client.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error(`❌ Failed to get user verification for nullifier ${nullifier}:`, error);
      return null;
    }
  }

  // Check if user is already verified (anti-replay protection)
  async isUserVerified(nullifier) {
    try {
      const verification = await this.getUserVerification(nullifier);
      return verification && verification.verified === true;
    } catch (error) {
      console.error(`❌ Failed to check user verification for nullifier ${nullifier}:`, error);
      return false;
    }
  }

  // Store verification status for polling (default TTL: 1 hour)
  async setVerificationStatus(requestId, status, ttl = 3600) {
    const key = `verification_status:${requestId}`;

    // Always store in memory cache as backup
    this.setMemoryCache(key, status, ttl);

    return await this.executeWithFallback(async () => {
      await this.client.setEx(key, ttl, status);
      console.log(`✅ Verification status set in Redis for request ${requestId}: ${status}`);
      return true;
    }, null, true); // Return true even if Redis fails (stored in memory)
  }

  // Get current verification status for frontend polling
  async getVerificationStatus(requestId) {
    const key = `verification_status:${requestId}`;

    return await this.executeWithFallback(async () => {
      const result = await this.client.get(key);

      // Update memory cache if found in Redis
      if (result) {
        this.setMemoryCache(key, result, 3600);
      }

      return result;
    }, key, null); // Fallback to memory cache using key
  }

  // Health check for monitoring systems
  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return false;
    }
  }

  // Quick connection status check
  isHealthy() {
    return this.isConnected && !this.circuitBreakerOpen;
  }

  // Get detailed Redis service status for monitoring
  getStatus() {
    return {
      connected: this.isConnected,
      circuitBreakerOpen: this.circuitBreakerOpen,
      failures: this.circuitBreakerFailures,
      reconnectAttempts: this.reconnectAttempts,
      lastFailure: this.lastCircuitBreakerOpen,
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.maxCacheSize,
        utilizationPercent: Math.round((this.memoryCache.size / this.maxCacheSize) * 100)
      }
    };
  }

  // Get memory cache statistics
  getCacheStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAge = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredCount++;
      }
      totalAge += now - entry.createdAt;
    }

    return {
      totalEntries: this.memoryCache.size,
      expiredEntries: expiredCount,
      averageAgeMs: this.memoryCache.size > 0 ? Math.round(totalAge / this.memoryCache.size) : 0,
      utilizationPercent: Math.round((this.memoryCache.size / this.maxCacheSize) * 100)
    };
  }
}

// Export singleton instance for application use
const redisService = new RedisService();
module.exports = redisService;