const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.circuitBreakerFailures = 0;
    this.circuitBreakerThreshold = 5;
    this.circuitBreakerOpen = false;
    this.circuitBreakerResetTime = 60000;
    this.lastCircuitBreakerOpen = null;

    this.memoryCache = new Map();
    this.maxCacheSize = 10000;
    this.cacheCleanupInterval = 5 * 60 * 1000;

    setInterval(() => this.cleanupExpiredEntries(), this.cacheCleanupInterval);
  }

  async connect() {
    try {
      this.client = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
        this.handleConnectionFailure();
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.resetCircuitBreaker();
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
        this.scheduleReconnection();
      });

      this.client.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

      this.client.on('end', () => {
        this.isConnected = false;
      });

      await this.client.connect();
      await this.client.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.handleConnectionFailure();
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  handleConnectionFailure() {
    this.circuitBreakerFailures++;
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.openCircuitBreaker();
    }
  }

  openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    this.lastCircuitBreakerOpen = Date.now();
    console.log(`Circuit breaker opened after ${this.circuitBreakerFailures} failures`);
    setTimeout(() => this.resetCircuitBreaker(), this.circuitBreakerResetTime);
  }

  resetCircuitBreaker() {
    this.circuitBreakerOpen = false;
    this.circuitBreakerFailures = 0;
    this.lastCircuitBreakerOpen = null;
  }

  scheduleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection attempt failed:', error.message);
      }
    }, delay);
  }

  cleanupExpiredEntries() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  setMemoryCache(key, value, ttl = 3600) {
    if (this.memoryCache.size >= this.maxCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: ttl > 0 ? Date.now() + (ttl * 1000) : null,
      createdAt: Date.now()
    });
  }

  getMemoryCache(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  async executeWithFallback(operation, fallbackKey = null, fallbackValue = null) {
    if (this.circuitBreakerOpen || !this.isConnected || !this.client) {
      return fallbackKey ? this.getMemoryCache(fallbackKey) : fallbackValue;
    }

    try {
      const result = await operation();
      this.circuitBreakerFailures = Math.max(0, this.circuitBreakerFailures - 1);
      return result;
    } catch (error) {
      console.error('Redis operation failed, falling back to memory cache:', error.message);
      this.handleConnectionFailure();
      return fallbackKey ? this.getMemoryCache(fallbackKey) : fallbackValue;
    }
  }

  async setAuthRequest(sessionId, authRequest, ttl = 3600) {
    const key = `auth_request:${sessionId}`;
    this.setMemoryCache(key, authRequest, ttl);

    return await this.executeWithFallback(async () => {
      await this.client.setEx(key, ttl, JSON.stringify(authRequest));
      return true;
    }, null, true);
  }

  async getAuthRequest(sessionId) {
    const key = `auth_request:${sessionId}`;

    return await this.executeWithFallback(async () => {
      const result = await this.client.get(key);
      const authRequest = result ? JSON.parse(result) : null;
      if (authRequest) this.setMemoryCache(key, authRequest, 3600);
      return authRequest;
    }, key, null);
  }

  async setVerificationStatus(requestId, status, ttl = 3600) {
    const key = `verification_status:${requestId}`;
    this.setMemoryCache(key, status, ttl);

    return await this.executeWithFallback(async () => {
      await this.client.setEx(key, ttl, status);
      return true;
    }, null, true);
  }

  async getVerificationStatus(requestId) {
    const key = `verification_status:${requestId}`;

    return await this.executeWithFallback(async () => {
      const result = await this.client.get(key);
      if (result) this.setMemoryCache(key, result, 3600);
      return result;
    }, key, null);
  }

  async healthCheck() {
    try {
      if (!this.client || !this.isConnected) return false;
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  isHealthy() {
    return this.isConnected && !this.circuitBreakerOpen;
  }

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

  getCacheStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAge = 0;

    for (const [, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) expiredCount++;
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

module.exports = new RedisService();
