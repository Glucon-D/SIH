// Local database sync service using IndexedDB for better performance
// This service provides caching and offline capabilities for threads and messages

class LocalSyncService {
  constructor() {
    this.dbName = 'DKO_LocalSync';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  // Initialize IndexedDB
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create threads store
        if (!db.objectStoreNames.contains('threads')) {
          const threadsStore = db.createObjectStore('threads', { keyPath: '_id' });
          threadsStore.createIndex('userId', 'userId', { unique: false });
          threadsStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
          threadsStore.createIndex('status', 'status', { unique: false });
          threadsStore.createIndex('category', 'category', { unique: false });
        }

        // Create messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: '_id' });
          messagesStore.createIndex('threadId', 'threadId', { unique: false });
          messagesStore.createIndex('userId', 'userId', { unique: false });
          messagesStore.createIndex('createdOn', 'createdOn', { unique: false });
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  // Generic method to perform database operations
  async performTransaction(storeName, mode, operation) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      try {
        const result = operation(store);
        if (result && result.onsuccess) {
          result.onsuccess = (event) => resolve(event.target.result);
          result.onerror = () => reject(result.error);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  // THREADS METHODS

  // Cache threads locally
  async cacheThreads(threads, userId) {
    try {
      await this.performTransaction('threads', 'readwrite', (store) => {
        threads.forEach(thread => {
          // Add cache metadata
          thread._cached = true;
          thread._cacheTime = Date.now();
          thread._userId = userId;
          store.put(thread);
        });
      });

      // Update sync metadata
      await this.updateSyncMeta('threads_last_sync', Date.now());
      console.log(`Cached ${threads.length} threads locally`);
    } catch (error) {
      console.error('Failed to cache threads:', error);
    }
  }

  // Get cached threads
  async getCachedThreads(userId, filters = {}) {
    try {
      const threads = await this.performTransaction('threads', 'readonly', (store) => {
        const index = store.index('userId');
        return index.getAll(userId);
      });

      if (!threads || threads.length === 0) {
        return { threads: [], fromCache: false };
      }

      // Apply filters
      let filteredThreads = threads.filter(thread => thread.isActive !== false);

      if (filters.status) {
        filteredThreads = filteredThreads.filter(thread => thread.status === filters.status);
      }

      if (filters.category) {
        filteredThreads = filteredThreads.filter(thread => thread.category === filters.category);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredThreads = filteredThreads.filter(thread => 
          thread.title?.toLowerCase().includes(searchLower) ||
          thread.description?.toLowerCase().includes(searchLower) ||
          thread.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Sort by lastMessageAt
      filteredThreads.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const startIndex = (page - 1) * limit;
      const paginatedThreads = filteredThreads.slice(startIndex, startIndex + limit);

      return {
        threads: paginatedThreads,
        fromCache: true,
        pagination: {
          page,
          limit,
          total: filteredThreads.length,
          pages: Math.ceil(filteredThreads.length / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get cached threads:', error);
      return { threads: [], fromCache: false };
    }
  }

  // Check if threads cache is fresh
  async isThreadsCacheFresh(maxAge = 5 * 60 * 1000) { // 5 minutes default
    try {
      const lastSync = await this.getSyncMeta('threads_last_sync');
      if (!lastSync) return false;
      
      return (Date.now() - lastSync) < maxAge;
    } catch (error) {
      console.error('Failed to check cache freshness:', error);
      return false;
    }
  }

  // Update a single thread in cache
  async updateCachedThread(thread) {
    try {
      thread._cached = true;
      thread._cacheTime = Date.now();
      
      await this.performTransaction('threads', 'readwrite', (store) => {
        return store.put(thread);
      });
      
      console.log('Updated cached thread:', thread._id);
    } catch (error) {
      console.error('Failed to update cached thread:', error);
    }
  }

  // Remove thread from cache
  async removeCachedThread(threadId) {
    try {
      await this.performTransaction('threads', 'readwrite', (store) => {
        return store.delete(threadId);
      });
      
      console.log('Removed cached thread:', threadId);
    } catch (error) {
      console.error('Failed to remove cached thread:', error);
    }
  }

  // MESSAGES METHODS

  // Cache messages for a thread
  async cacheMessages(threadId, messages) {
    try {
      await this.performTransaction('messages', 'readwrite', (store) => {
        messages.forEach(message => {
          message._cached = true;
          message._cacheTime = Date.now();
          store.put(message);
        });
      });

      await this.updateSyncMeta(`messages_${threadId}_last_sync`, Date.now());
      console.log(`Cached ${messages.length} messages for thread ${threadId}`);
    } catch (error) {
      console.error('Failed to cache messages:', error);
    }
  }

  // Get cached messages for a thread
  async getCachedMessages(threadId, page = 1, limit = 50) {
    try {
      const messages = await this.performTransaction('messages', 'readonly', (store) => {
        const index = store.index('threadId');
        return index.getAll(threadId);
      });

      if (!messages || messages.length === 0) {
        return { messages: [], fromCache: false };
      }

      // Sort by creation time
      messages.sort((a, b) => new Date(a.createdOn) - new Date(b.createdOn));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedMessages = messages.slice(startIndex, startIndex + limit);

      return {
        messages: paginatedMessages,
        fromCache: true,
        pagination: {
          page,
          limit,
          total: messages.length,
          pages: Math.ceil(messages.length / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get cached messages:', error);
      return { messages: [], fromCache: false };
    }
  }

  // Check if messages cache is fresh for a thread
  async isMessagesCacheFresh(threadId, maxAge = 2 * 60 * 1000) { // 2 minutes default
    try {
      const lastSync = await this.getSyncMeta(`messages_${threadId}_last_sync`);
      if (!lastSync) return false;
      
      return (Date.now() - lastSync) < maxAge;
    } catch (error) {
      console.error('Failed to check messages cache freshness:', error);
      return false;
    }
  }

  // SYNC METADATA METHODS

  async updateSyncMeta(key, value) {
    try {
      await this.performTransaction('syncMeta', 'readwrite', (store) => {
        return store.put({ key, value, timestamp: Date.now() });
      });
    } catch (error) {
      console.error('Failed to update sync metadata:', error);
    }
  }

  async getSyncMeta(key) {
    try {
      const result = await this.performTransaction('syncMeta', 'readonly', (store) => {
        return store.get(key);
      });
      return result?.value;
    } catch (error) {
      console.error('Failed to get sync metadata:', error);
      return null;
    }
  }

  // UTILITY METHODS

  // Clear all cached data
  async clearCache() {
    try {
      await this.performTransaction('threads', 'readwrite', (store) => {
        return store.clear();
      });
      
      await this.performTransaction('messages', 'readwrite', (store) => {
        return store.clear();
      });
      
      await this.performTransaction('syncMeta', 'readwrite', (store) => {
        return store.clear();
      });
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const [threadsCount, messagesCount] = await Promise.all([
        this.performTransaction('threads', 'readonly', (store) => store.count()),
        this.performTransaction('messages', 'readonly', (store) => store.count())
      ]);

      return {
        threads: threadsCount,
        messages: messagesCount,
        lastThreadsSync: await this.getSyncMeta('threads_last_sync'),
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { threads: 0, messages: 0, isInitialized: false };
    }
  }
}

// Create and export singleton instance
export const localSyncService = new LocalSyncService();
export default localSyncService;
