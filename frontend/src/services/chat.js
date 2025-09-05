import { apiService } from "./api";
import { localSyncService } from "./localSync";

export const chatService = {
  // Get threads with local caching
  getThreads: async (filters = {}) => {
    try {
      // For now, fetch directly from server (caching can be re-enabled later)
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key]);
        }
      });

      const response = await apiService.get(`/threads?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new thread
  createThread: async (threadData) => {
    try {
      const response = await apiService.post("/threads", threadData);

      // Update cache with new thread
      if (response.data.success && response.data.data.thread) {
        await localSyncService.updateCachedThread(response.data.data.thread);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single thread
  getThread: async (threadId) => {
    try {
      const response = await apiService.get(`/threads/${threadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update thread
  updateThread: async (threadId, updateData) => {
    try {
      const response = await apiService.put(`/threads/${threadId}`, updateData);

      // Update cache with modified thread
      if (response.data.success && response.data.data.thread) {
        await localSyncService.updateCachedThread(response.data.data.thread);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete thread
  deleteThread: async (threadId) => {
    try {
      const response = await apiService.delete(`/threads/${threadId}`);

      // Remove from cache
      if (response.data.success) {
        await localSyncService.removeCachedThread(threadId);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get chat history with local caching
  getChatHistory: async (threadId, options = {}) => {
    try {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 50;

      // Check if we have fresh cached messages
      const isCacheFresh = await localSyncService.isMessagesCacheFresh(threadId);

      if (isCacheFresh) {
        console.log(`Using cached messages for thread ${threadId}`);
        const cachedResult = await localSyncService.getCachedMessages(threadId, page, limit);
        if (cachedResult.fromCache && cachedResult.messages.length > 0) {
          return {
            success: true,
            data: cachedResult,
            fromCache: true
          };
        }
      }

      // Fetch from server
      console.log(`Fetching messages from server for thread ${threadId}`);
      const params = new URLSearchParams();

      if (options.page) params.append("page", options.page);
      if (options.limit) params.append("limit", options.limit);

      const response = await apiService.get(
        `/chat/history/${threadId}?${params.toString()}`
      );

      // Cache the response
      if (response.data.success && response.data.data.messages) {
        await localSyncService.cacheMessages(threadId, response.data.data.messages);
      }

      return response.data;
    } catch (error) {
      // If server fails, try to return cached data as fallback
      try {
        console.log(`Server failed, attempting to use cached messages for thread ${threadId}`);
        const cachedResult = await localSyncService.getCachedMessages(threadId, page, limit);
        if (cachedResult.fromCache && cachedResult.messages.length > 0) {
          return {
            success: true,
            data: cachedResult,
            fromCache: true,
            offline: true
          };
        }
      } catch (cacheError) {
        console.error('Message cache fallback also failed:', cacheError);
      }

      throw error;
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    try {
      const response = await apiService.post("/chat/send", messageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Stream chat (for AI responses)
  streamChat: async (chatData) => {
    try {
      // Debug logging
      console.log("Sending chat data:", chatData);

      // For streaming, we'll use fetch directly to handle the stream
      const token = localStorage.getItem(
        import.meta.env.VITE_JWT_STORAGE_KEY || "dko_auth_token"
      );

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5010/api"
        }/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(chatData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Stream chat error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // The response will be handled by socket events, but we still return it
      // for compatibility and potential future use
      return response;
    } catch (error) {
      console.error("Stream chat error:", error);
      throw error;
    }
  },

  // Edit message
  editMessage: async (messageId, content) => {
    try {
      const response = await apiService.put(`/chat/message/${messageId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await apiService.delete(`/chat/message/${messageId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add reaction to message
  addReaction: async (messageId, reactionType) => {
    try {
      const response = await apiService.post(
        `/chat/message/${messageId}/reaction`,
        {
          type: reactionType,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Remove reaction from message
  removeReaction: async (messageId) => {
    try {
      const response = await apiService.delete(
        `/chat/message/${messageId}/reaction`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add feedback to thread
  addFeedback: async (threadId, feedbackData) => {
    try {
      const response = await apiService.post(
        `/threads/${threadId}/feedback`,
        feedbackData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get thread messages
  getThreadMessages: async (threadId, options = {}) => {
    try {
      const params = new URLSearchParams();

      if (options.page) params.append("page", options.page);
      if (options.limit) params.append("limit", options.limit);

      const response = await apiService.get(
        `/threads/${threadId}/messages?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Transcribe audio
  transcribeAudio: async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await apiService.upload('/chat/transcribe', formData);
      return response.data;
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  },

  // Cache management methods
  clearCache: async () => {
    try {
      await localSyncService.clearCache();
      console.log('Chat cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear chat cache:', error);
      throw error;
    }
  },

  getCacheStats: async () => {
    try {
      return await localSyncService.getCacheStats();
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { threads: 0, messages: 0, isInitialized: false };
    }
  },

  // Force refresh from server (bypass cache)
  forceRefreshThreads: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key]);
        }
      });

      const response = await apiService.get(`/threads?${params.toString()}`);

      // Update cache with fresh data
      if (response.data.success && response.data.data.threads) {
        const userId = JSON.parse(localStorage.getItem('dko_user'))?.id;
        if (userId) {
          await localSyncService.cacheThreads(response.data.data.threads, userId);
        }
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
