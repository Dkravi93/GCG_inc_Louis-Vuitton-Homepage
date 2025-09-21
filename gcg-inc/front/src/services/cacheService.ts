import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
}

class CacheService {
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour default
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    total: 0,
    hitRate: 0
  };

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    this.redis.on('connect', () => {
      console.log('🔴 Connected to Redis');
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    this.redis.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    this.redis.on('close', () => {
      console.log('🔴 Redis connection closed');
    });
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const value = await this.redis.get(fullKey);
      
      if (value) {
        this.stats.hits++;
        this.stats.total++;
        this.updateHitRate();
        return JSON.parse(value);
      }
      
      this.stats.misses++;
      this.stats.total++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      const serializedValue = JSON.stringify(value);
      
      const result = await this.redis.setex(fullKey, ttl, serializedValue);
      return result === 'OK';
    } catch (error) {
      console.error('❌ Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('❌ Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache expire error:', error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, prefix?: string): Promise<number | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.incr(fullKey);
    } catch (error) {
      console.error('❌ Cache increment error:', error);
      return null;
    }
  }

  /**
   * Increment by a specific amount
   */
  async incrby(key: string, amount: number, prefix?: string): Promise<number | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.incrby(fullKey, amount);
    } catch (error) {
      console.error('❌ Cache increment by error:', error);
      return null;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[], prefix?: string): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, prefix));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (value) {
          try {
            return JSON.parse(value);
          } catch (error) {
            return null;
          }
        }
        return null;
      });
    } catch (error) {
      console.error('❌ Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.ttl || this.defaultTTL;
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.buildKey(key, options.prefix);
        const serializedValue = JSON.stringify(value);
        pipeline.setex(fullKey, ttl, serializedValue);
      }
      
      const results = await pipeline.exec();
      return results?.every(result => result[1] === 'OK') || false;
    } catch (error) {
      console.error('❌ Cache mset error:', error);
      return false;
    }
  }

  /**
   * Add to a list (left push)
   */
  async lpush(key: string, value: any, prefix?: string): Promise<number | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const serializedValue = JSON.stringify(value);
      return await this.redis.lpush(fullKey, serializedValue);
    } catch (error) {
      console.error('❌ Cache lpush error:', error);
      return null;
    }
  }

  /**
   * Get from list (right pop)
   */
  async rpop<T>(key: string, prefix?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const value = await this.redis.rpop(fullKey);
      
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('❌ Cache rpop error:', error);
      return null;
    }
  }

  /**
   * Get list range
   */
  async lrange<T>(key: string, start: number, stop: number, prefix?: string): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const values = await this.redis.lrange(fullKey, start, stop);
      
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error('❌ Cache lrange error:', error);
      return [];
    }
  }

  /**
   * Get list length
   */
  async llen(key: string, prefix?: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key, prefix);
      return await this.redis.llen(fullKey);
    } catch (error) {
      console.error('❌ Cache llen error:', error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, member: any, prefix?: string): Promise<number | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const serializedMember = JSON.stringify(member);
      return await this.redis.sadd(fullKey, serializedMember);
    } catch (error) {
      console.error('❌ Cache sadd error:', error);
      return null;
    }
  }

  /**
   * Get all set members
   */
  async smembers<T>(key: string, prefix?: string): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const members = await this.redis.smembers(fullKey);
      
      return members.map(member => JSON.parse(member));
    } catch (error) {
      console.error('❌ Cache smembers error:', error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: any, prefix?: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const serializedMember = JSON.stringify(member);
      const result = await this.redis.sismember(fullKey, serializedMember);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache sismember error:', error);
      return false;
    }
  }

  /**
   * Hash operations - set field
   */
  async hset(key: string, field: string, value: any, prefix?: string): Promise<number | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const serializedValue = JSON.stringify(value);
      return await this.redis.hset(fullKey, field, serializedValue);
    } catch (error) {
      console.error('❌ Cache hset error:', error);
      return null;
    }
  }

  /**
   * Hash operations - get field
   */
  async hget<T>(key: string, field: string, prefix?: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const value = await this.redis.hget(fullKey, field);
      
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('❌ Cache hget error:', error);
      return null;
    }
  }

  /**
   * Hash operations - get all fields
   */
  async hgetall<T>(key: string, prefix?: string): Promise<Record<string, T> | null> {
    try {
      const fullKey = this.buildKey(key, prefix);
      const hash = await this.redis.hgetall(fullKey);
      
      if (Object.keys(hash).length === 0) {
        return null;
      }
      
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Cache hgetall error:', error);
      return null;
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string, prefix?: string): Promise<string[]> {
    try {
      const fullPattern = prefix ? `${prefix}:${pattern}` : pattern;
      return await this.redis.keys(fullPattern);
    } catch (error) {
      console.error('❌ Cache keys error:', error);
      return [];
    }
  }

  /**
   * Clear all keys matching pattern
   */
  async clear(pattern: string = '*', prefix?: string): Promise<number> {
    try {
      const keys = await this.keys(pattern, prefix);
      
      if (keys.length === 0) {
        return 0;
      }
      
      return await this.redis.del(...keys);
    } catch (error) {
      console.error('❌ Cache clear error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      total: 0,
      hitRate: 0
    };
  }

  /**
   * Get memory usage info
   */
  async getMemoryInfo(): Promise<any> {
    try {
      const info = await this.redis.memory('usage');
      return info;
    } catch (error) {
      console.error('❌ Cache memory info error:', error);
      return null;
    }
  }

  /**
   * Flush all data (use with caution)
   */
  async flushAll(): Promise<boolean> {
    try {
      const result = await this.redis.flushall();
      return result === 'OK';
    } catch (error) {
      console.error('❌ Cache flush all error:', error);
      return false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.redis.status === 'ready';
  }

  /**
   * Get cache with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key, options);
      
      if (cached !== null) {
        return cached;
      }
      
      // Execute fallback and cache result
      const result = await fallback();
      await this.set(key, result, options);
      
      return result;
    } catch (error) {
      console.error('❌ Cache getOrSet error:', error);
      // If cache fails, still try to get from fallback
      return await fallback();
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('🔴 Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error);
    }
  }

  /**
   * Build full key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.total > 0 ? (this.stats.hits / this.stats.total) * 100 : 0;
  }
}

// Common cache prefixes
export const CACHE_PREFIXES = {
  PRODUCTS: 'products',
  COLLECTIONS: 'collections',
  USERS: 'users',
  ORDERS: 'orders',
  SESSIONS: 'sessions',
  ANALYTICS: 'analytics',
  CART: 'cart',
  SEARCH: 'search',
  RATE_LIMIT: 'rate_limit'
};

// Common TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

export const cacheService = new CacheService();
export default CacheService;