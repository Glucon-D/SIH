import { apiService } from "./api";

export const chatService = {
  // Get threads
  getThreads: async (filters = {}) => {
    try {
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
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete thread
  deleteThread: async (threadId) => {
    try {
      const response = await apiService.delete(`/threads/${threadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get chat history
  getChatHistory: async (threadId, options = {}) => {
    try {
      const params = new URLSearchParams();

      if (options.page) params.append("page", options.page);
      if (options.limit) params.append("limit", options.limit);

      const response = await apiService.get(
        `/chat/history/${threadId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
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
};
