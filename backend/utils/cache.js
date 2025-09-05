// Simple in-memory cache for better performance
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
  }

  // Set a value with optional TTL (in milliseconds)
  set(key, value, ttlMs = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
    return true;
  }

  // Get a value, returns null if expired or not found
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiry = this.ttl.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  // Delete a key
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    return true;
  }

  // Check if key exists and is not expired
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiry = this.ttl.get(key);
    if (expiry && Date.now() > expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Get cache statistics
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (expiry && now > expiry) {
        this.delete(key);
      }
    }
  }
}

// Create singleton instance
const cache = new MemoryCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

module.exports = cache;
