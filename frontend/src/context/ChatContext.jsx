import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { chatService } from "../services/chat";
import { localSyncService } from "../services/localSync";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useApp } from "./AppContext";

// Initial state
const initialState = {
  threads: [],
  currentThread: null,
  messages: [],
  messageCache: {}, // Cache messages per thread: { threadId: { messages: [], pagination: {} } }
  isLoading: false,
  isStreaming: false,
  isThinking: false,
  streamingMessage: "",
  typingUsers: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: true,
  },
  cacheStats: {
    threads: 0,
    messages: 0,
    isInitialized: false,
  },
  fromCache: false,
  isOffline: false,
};

// Action types
const actionTypes = {
  SET_THREADS: "SET_THREADS",
  ADD_THREADS: "ADD_THREADS",
  ADD_THREAD: "ADD_THREAD",
  UPDATE_THREAD: "UPDATE_THREAD",
  UPDATE_THREAD_TITLE: "UPDATE_THREAD_TITLE",
  DELETE_THREAD: "DELETE_THREAD",
  SET_CURRENT_THREAD: "SET_CURRENT_THREAD",
  SET_MESSAGES: "SET_MESSAGES",
  ADD_MESSAGE: "ADD_MESSAGE",
  UPDATE_MESSAGE: "UPDATE_MESSAGE",
  DELETE_MESSAGE: "DELETE_MESSAGE",
  SET_LOADING: "SET_LOADING",
  SET_STREAMING: "SET_STREAMING",
  SET_THINKING: "SET_THINKING",
  SET_STREAMING_MESSAGE: "SET_STREAMING_MESSAGE",
  ADD_TYPING_USER: "ADD_TYPING_USER",
  REMOVE_TYPING_USER: "REMOVE_TYPING_USER",
  SET_PAGINATION: "SET_PAGINATION",
  CLEAR_MESSAGES: "CLEAR_MESSAGES",
  SET_CACHE_STATS: "SET_CACHE_STATS",
  SET_FROM_CACHE: "SET_FROM_CACHE",
  SET_OFFLINE: "SET_OFFLINE",
  CACHE_MESSAGES: "CACHE_MESSAGES",
  LOAD_CACHED_MESSAGES: "LOAD_CACHED_MESSAGES",
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_THREADS:
      return { ...state, threads: action.payload };

    case actionTypes.ADD_THREADS:
      return { ...state, threads: [...state.threads, ...action.payload] };

    case actionTypes.ADD_THREAD:
      return { ...state, threads: [action.payload, ...state.threads] };

    case actionTypes.UPDATE_THREAD:
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread._id === action.payload._id
            ? { ...thread, ...action.payload }
            : thread
        ),
        currentThread:
          state.currentThread?._id === action.payload._id
            ? { ...state.currentThread, ...action.payload }
            : state.currentThread,
      };

    case actionTypes.UPDATE_THREAD_TITLE:
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread._id === action.payload.threadId
            ? { ...thread, title: action.payload.title }
            : thread
        ),
        currentThread:
          state.currentThread?._id === action.payload.threadId
            ? { ...state.currentThread, title: action.payload.title }
            : state.currentThread,
      };

    case actionTypes.DELETE_THREAD:
      return {
        ...state,
        threads: state.threads.filter(
          (thread) => thread._id !== action.payload
        ),
        currentThread:
          state.currentThread?._id === action.payload
            ? null
            : state.currentThread,
      };

    case actionTypes.SET_CURRENT_THREAD:
      return { ...state, currentThread: action.payload };

    case actionTypes.SET_MESSAGES:
      return {
        ...state,
        messages:
          typeof action.payload === "function"
            ? action.payload(state.messages)
            : action.payload,
      };

    case actionTypes.ADD_MESSAGE:
      // Check if message already exists to prevent duplicates
      const messageExists = state.messages.some(
        (msg) =>
          msg._id === action.payload._id ||
          (msg.content === action.payload.content &&
            msg.role === action.payload.role &&
            Math.abs(
              new Date(msg.createdOn) - new Date(action.payload.createdOn)
            ) < 1000)
      );

      if (messageExists) {
        return state;
      }

      return { ...state, messages: [...state.messages, action.payload] };

    case actionTypes.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map((message) =>
          message._id === action.payload._id
            ? { ...message, ...action.payload }
            : message
        ),
      };

    case actionTypes.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(
          (message) => message._id !== action.payload
        ),
      };

    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case actionTypes.SET_STREAMING:
      return { ...state, isStreaming: action.payload };

    case actionTypes.SET_THINKING:
      return { ...state, isThinking: action.payload };

    case actionTypes.SET_STREAMING_MESSAGE:
      return {
        ...state,
        streamingMessage:
          typeof action.payload === "function"
            ? action.payload(state.streamingMessage)
            : action.payload,
      };

    case actionTypes.ADD_TYPING_USER:
      return {
        ...state,
        typingUsers: [
          ...state.typingUsers.filter((u) => u.id !== action.payload.id),
          action.payload,
        ],
      };

    case actionTypes.REMOVE_TYPING_USER:
      return {
        ...state,
        typingUsers: state.typingUsers.filter((u) => u.id !== action.payload),
      };

    case actionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case actionTypes.CLEAR_MESSAGES:
      return { ...state, messages: [], streamingMessage: "" };

    case actionTypes.SET_CACHE_STATS:
      return { ...state, cacheStats: action.payload };

    case actionTypes.SET_FROM_CACHE:
      return { ...state, fromCache: action.payload };

    case actionTypes.SET_OFFLINE:
      return { ...state, isOffline: action.payload };

    case actionTypes.CACHE_MESSAGES:
      return {
        ...state,
        messageCache: {
          ...state.messageCache,
          [action.payload.threadId]: {
            messages: action.payload.messages,
            pagination: action.payload.pagination,
            lastUpdated: Date.now()
          }
        }
      };

    case actionTypes.LOAD_CACHED_MESSAGES:
      const cachedData = state.messageCache[action.payload.threadId];
      return {
        ...state,
        messages: cachedData ? cachedData.messages : [],
        pagination: cachedData ? cachedData.pagination : state.pagination
      };

    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { isAuthenticated } = useAuth();
  const { socket, isConnected, joinThread, leaveThread } = useSocket();
  const { addNotification, setError } = useApp();

  // Socket event handlers
  useEffect(() => {
    if (socket && isConnected) {
      // Message events
      socket.on("message_chunk", (data) => {
        console.log("Received message chunk:", data);
        dispatch({
          type: actionTypes.SET_STREAMING_MESSAGE,
          payload: (prevMessage) => prevMessage + data.chunk,
        });
      });

      socket.on("message_complete", (data) => {
        console.log("Message complete:", data);
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: data.message });
        dispatch({ type: actionTypes.SET_STREAMING, payload: false });
        dispatch({ type: actionTypes.SET_THINKING, payload: false });
        dispatch({ type: actionTypes.SET_STREAMING_MESSAGE, payload: "" });
      });

      socket.on("new_message", (data) => {
        console.log("Received new message:", data);
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: data.message });

        // Invalidate cache for this thread since we have new messages
        if (data.message.threadId) {
          dispatch({
            type: actionTypes.CACHE_MESSAGES,
            payload: {
              threadId: data.message.threadId,
              messages: [...state.messages, data.message],
              pagination: state.pagination
            }
          });
        }
      });

      socket.on("message_updated", (data) => {
        dispatch({ type: actionTypes.UPDATE_MESSAGE, payload: data.message });

        // Update cache as well
        if (data.message.threadId && state.messageCache[data.message.threadId]) {
          const cachedData = state.messageCache[data.message.threadId];
          const updatedMessages = cachedData.messages.map(msg =>
            msg._id === data.message._id ? data.message : msg
          );
          dispatch({
            type: actionTypes.CACHE_MESSAGES,
            payload: {
              threadId: data.message.threadId,
              messages: updatedMessages,
              pagination: cachedData.pagination
            }
          });
        }
      });

      socket.on("message_deleted", (data) => {
        dispatch({ type: actionTypes.DELETE_MESSAGE, payload: data.messageId });

        // Update cache by removing the deleted message
        if (data.threadId && state.messageCache[data.threadId]) {
          const cachedData = state.messageCache[data.threadId];
          const filteredMessages = cachedData.messages.filter(msg => msg._id !== data.messageId);
          dispatch({
            type: actionTypes.CACHE_MESSAGES,
            payload: {
              threadId: data.threadId,
              messages: filteredMessages,
              pagination: cachedData.pagination
            }
          });
        }
      });

      // Typing events
      socket.on("user_typing", (data) => {
        dispatch({ type: actionTypes.ADD_TYPING_USER, payload: data.user });

        // Remove typing indicator after timeout
        setTimeout(() => {
          dispatch({
            type: actionTypes.REMOVE_TYPING_USER,
            payload: data.user.id,
          });
        }, 3000);
      });

      socket.on("user_stopped_typing", (data) => {
        dispatch({
          type: actionTypes.REMOVE_TYPING_USER,
          payload: data.userId,
        });
      });

      // Thread events
      socket.on("thread_updated", (data) => {
        // Handle both old format (data.thread) and new format (data.threadId, data.title)
        if (data.thread) {
          dispatch({ type: actionTypes.UPDATE_THREAD, payload: data.thread });
        } else if (data.threadId && data.title) {
          dispatch({
            type: actionTypes.UPDATE_THREAD_TITLE,
            payload: { threadId: data.threadId, title: data.title },
          });
        }
      });

      return () => {
        socket.off("message_chunk");
        socket.off("message_complete");
        socket.off("new_message");
        socket.off("message_updated");
        socket.off("message_deleted");
        socket.off("user_typing");
        socket.off("user_stopped_typing");
        socket.off("thread_updated");
      };
    }
  }, [socket, isConnected]);

  // Initialize local sync service (temporarily disabled for debugging)
  // useEffect(() => {
  //   const initializeSync = async () => {
  //     try {
  //       await localSyncService.init();
  //       const stats = await chatService.getCacheStats();
  //       dispatch({ type: actionTypes.SET_CACHE_STATS, payload: stats });
  //       console.log('Local sync service initialized:', stats);
  //     } catch (error) {
  //       console.error('Failed to initialize local sync service:', error);
  //     }
  //   };

  //   if (isAuthenticated) {
  //     initializeSync();
  //   }
  // }, [isAuthenticated]);

  // Actions - Memoized with useCallback to prevent unnecessary re-renders
  const loadThreads = useCallback(
    async (filters = {}) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        dispatch({ type: actionTypes.SET_FROM_CACHE, payload: false });
        dispatch({ type: actionTypes.SET_OFFLINE, payload: false });

        const response = await chatService.getThreads(filters);

        if (response.success) {
          if (filters.append) {
            // Append new threads for pagination
            dispatch({
              type: actionTypes.ADD_THREADS,
              payload: response.data.threads,
            });
          } else {
            // Replace threads for new search/filter
            dispatch({
              type: actionTypes.SET_THREADS,
              payload: response.data.threads,
            });
          }
          dispatch({
            type: actionTypes.SET_PAGINATION,
            payload: response.data.pagination,
          });

          // Update cache status indicators
          dispatch({ type: actionTypes.SET_FROM_CACHE, payload: response.fromCache || false });
          dispatch({ type: actionTypes.SET_OFFLINE, payload: response.offline || false });

          // Show cache notification if data is from cache
          if (response.fromCache) {
            addNotification({
              type: response.offline ? "warning" : "info",
              message: response.offline
                ? "Showing cached data - you're offline"
                : "Showing cached data for faster loading",
              duration: 3000,
            });
          }
        } else {
          throw new Error(response.message || "Failed to load threads");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load threads";
        setError(errorMessage);
        addNotification({
          type: "error",
          message: errorMessage,
        });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },
    [setError, addNotification]
  );

  const createThread = useCallback(
    async (threadData) => {
      try {
        const response = await chatService.createThread(threadData);

        if (response.success) {
          dispatch({
            type: actionTypes.ADD_THREAD,
            payload: response.data.thread,
          });
          addNotification({
            type: "success",
            message: "Thread created successfully",
          });
          return response.data.thread;
        } else {
          throw new Error(response.message || "Failed to create thread");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to create thread";
        setError(errorMessage);
        addNotification({
          type: "error",
          message: errorMessage,
        });
        return null;
      }
    },
    [setError, addNotification]
  );

  const selectThread = useCallback(async (thread) => {
    try {
      // Leave current thread
      if (state.currentThread) {
        leaveThread(state.currentThread._id);
      }

      // Set new current thread
      dispatch({ type: actionTypes.SET_CURRENT_THREAD, payload: thread });

      // Join new thread
      if (thread) {
        // Check if we have cached messages for this thread
        const cachedData = state.messageCache[thread._id];
        const isCacheFresh = cachedData && (Date.now() - cachedData.lastUpdated) < 2 * 60 * 1000; // 2 minutes

        if (isCacheFresh) {
          // Load cached messages immediately (no loading state)
          dispatch({ type: actionTypes.LOAD_CACHED_MESSAGES, payload: { threadId: thread._id } });
        } else {
          // Clear messages only if no cache exists
          dispatch({ type: actionTypes.CLEAR_MESSAGES });
        }

        console.log("Joining thread:", thread._id);
        joinThread(thread._id);

        // Load fresh messages (in background if cached, with loading if not cached)
        await loadMessages(thread._id, 1, !isCacheFresh);
      }
    } catch (error) {
      console.error("Error selecting thread:", error);
      addNotification({
        type: "error",
        message: "Failed to select thread",
      });
    }
  }, [state.currentThread, state.messageCache, leaveThread, joinThread, addNotification]);

  const loadMessages = async (threadId, page = 1, showLoading = true) => {
    try {
      if (showLoading) {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
      }

      const response = await chatService.getChatHistory(threadId, {
        page,
        limit: state.pagination.limit,
      });

      if (response.success) {
        if (page === 1) {
          dispatch({
            type: actionTypes.SET_MESSAGES,
            payload: response.data.messages,
          });

          // Cache the messages for this thread
          dispatch({
            type: actionTypes.CACHE_MESSAGES,
            payload: {
              threadId,
              messages: response.data.messages,
              pagination: response.data.pagination
            }
          });
        } else {
          dispatch({
            type: actionTypes.SET_MESSAGES,
            payload: [...response.data.messages, ...state.messages],
          });
        }
        dispatch({
          type: actionTypes.SET_PAGINATION,
          payload: response.data.pagination,
        });
      } else {
        throw new Error(response.message || "Failed to load messages");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load messages";
      setError(errorMessage);
      addNotification({
        type: "error",
        message: errorMessage,
      });
    } finally {
      if (showLoading) {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }
  };

  const sendMessage = useCallback(
    async (threadId, content) => {
      try {
        // Show thinking state immediately
        dispatch({ type: actionTypes.SET_THINKING, payload: true });
        dispatch({ type: actionTypes.SET_STREAMING, payload: true });

        // If no threadId provided, create a new thread first
        let actualThreadId = threadId;
        if (!actualThreadId) {
          const newThread = await createThread({
            title: "New Chat",
            category: "general_query",
          });

          if (!newThread) {
            throw new Error("Failed to create thread");
          }

          actualThreadId = newThread._id;

          // Select the new thread
          dispatch({
            type: actionTypes.SET_CURRENT_THREAD,
            payload: newThread,
          });
          console.log("Joining new thread:", actualThreadId);
          joinThread(actualThreadId);
        }

        // Don't add temporary user message - let backend handle it via socket events

        const response = await chatService.streamChat({
          threadId: actualThreadId,
          message: content,
          model: "google/gemini-2.5-flash-lite",
        });

        // The streaming response will be handled by socket events
        return response;
      } catch (error) {
        dispatch({ type: actionTypes.SET_STREAMING, payload: false });
        dispatch({ type: actionTypes.SET_THINKING, payload: false });
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to send message";
        setError(errorMessage);
        addNotification({
          type: "error",
          message: errorMessage,
        });
        return null;
      }
    },
    [createThread, joinThread, setError, addNotification]
  );

  const updateThread = useCallback(
    async (threadId, updateData) => {
      try {
        const response = await chatService.updateThread(threadId, updateData);

        if (response.success) {
          dispatch({
            type: actionTypes.UPDATE_THREAD,
            payload: response.data.thread,
          });
          addNotification({
            type: "success",
            message: "Thread updated successfully",
          });
          return response.data.thread;
        } else {
          throw new Error(response.message || "Failed to update thread");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to update thread";
        setError(errorMessage);
        addNotification({
          type: "error",
          message: errorMessage,
        });
        return null;
      }
    },
    [setError, addNotification]
  );

  const deleteThread = async (threadId) => {
    try {
      const response = await chatService.deleteThread(threadId);

      if (response.success) {
        dispatch({ type: actionTypes.DELETE_THREAD, payload: threadId });
        addNotification({
          type: "success",
          message: "Thread deleted successfully",
        });
      } else {
        throw new Error(response.message || "Failed to delete thread");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete thread";
      setError(errorMessage);
      addNotification({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // Cache management functions
  const clearCache = useCallback(async () => {
    try {
      await chatService.clearCache();
      const stats = await chatService.getCacheStats();
      dispatch({ type: actionTypes.SET_CACHE_STATS, payload: stats });
      addNotification({
        type: "success",
        message: "Cache cleared successfully",
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      addNotification({
        type: "error",
        message: "Failed to clear cache",
      });
    }
  }, [addNotification]);

  const refreshCacheStats = useCallback(async () => {
    try {
      const stats = await chatService.getCacheStats();
      dispatch({ type: actionTypes.SET_CACHE_STATS, payload: stats });
    } catch (error) {
      console.error('Failed to refresh cache stats:', error);
    }
  }, []);

  const forceRefresh = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await chatService.forceRefreshThreads(filters);

      if (response.success) {
        dispatch({
          type: actionTypes.SET_THREADS,
          payload: response.data.threads,
        });
        dispatch({
          type: actionTypes.SET_PAGINATION,
          payload: response.data.pagination,
        });
        dispatch({ type: actionTypes.SET_FROM_CACHE, payload: false });
        dispatch({ type: actionTypes.SET_OFFLINE, payload: false });

        addNotification({
          type: "success",
          message: "Data refreshed from server",
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to refresh data";
      setError(errorMessage);
      addNotification({
        type: "error",
        message: errorMessage,
      });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, [setError, addNotification]);

  // Load threads when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadThreads();
    } else {
      dispatch({ type: actionTypes.SET_THREADS, payload: [] });
      dispatch({ type: actionTypes.SET_CURRENT_THREAD, payload: null });
      dispatch({ type: actionTypes.CLEAR_MESSAGES });
    }
  }, [isAuthenticated]); // Removed loadThreads from dependency array to prevent infinite re-renders

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      ...state,
      loadThreads,
      createThread,
      selectThread,
      loadMessages,
      sendMessage,
      updateThread,
      deleteThread,
      clearCache,
      refreshCacheStats,
      forceRefresh,
    }),
    [
      state,
      loadThreads,
      createThread,
      selectThread,
      loadMessages,
      sendMessage,
      updateThread,
      deleteThread,
      clearCache,
      refreshCacheStats,
      forceRefresh,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
