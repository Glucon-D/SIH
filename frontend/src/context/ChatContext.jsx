import { createContext, useContext, useReducer, useEffect } from 'react';
import { chatService } from '../services/chat';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useApp } from './AppContext';

// Initial state
const initialState = {
  threads: [],
  currentThread: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: '',
  typingUsers: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    hasMore: true
  }
};

// Action types
const actionTypes = {
  SET_THREADS: 'SET_THREADS',
  ADD_THREAD: 'ADD_THREAD',
  UPDATE_THREAD: 'UPDATE_THREAD',
  DELETE_THREAD: 'DELETE_THREAD',
  SET_CURRENT_THREAD: 'SET_CURRENT_THREAD',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  SET_LOADING: 'SET_LOADING',
  SET_STREAMING: 'SET_STREAMING',
  SET_STREAMING_MESSAGE: 'SET_STREAMING_MESSAGE',
  ADD_TYPING_USER: 'ADD_TYPING_USER',
  REMOVE_TYPING_USER: 'REMOVE_TYPING_USER',
  SET_PAGINATION: 'SET_PAGINATION',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES'
};

// Reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_THREADS:
      return { ...state, threads: action.payload };
    
    case actionTypes.ADD_THREAD:
      return { ...state, threads: [action.payload, ...state.threads] };
    
    case actionTypes.UPDATE_THREAD:
      return {
        ...state,
        threads: state.threads.map(thread =>
          thread._id === action.payload._id ? { ...thread, ...action.payload } : thread
        ),
        currentThread: state.currentThread?._id === action.payload._id
          ? { ...state.currentThread, ...action.payload }
          : state.currentThread
      };
    
    case actionTypes.DELETE_THREAD:
      return {
        ...state,
        threads: state.threads.filter(thread => thread._id !== action.payload),
        currentThread: state.currentThread?._id === action.payload ? null : state.currentThread
      };
    
    case actionTypes.SET_CURRENT_THREAD:
      return { ...state, currentThread: action.payload };
    
    case actionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case actionTypes.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    
    case actionTypes.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(message =>
          message._id === action.payload._id ? { ...message, ...action.payload } : message
        )
      };
    
    case actionTypes.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(message => message._id !== action.payload)
      };
    
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case actionTypes.SET_STREAMING:
      return { ...state, isStreaming: action.payload };
    
    case actionTypes.SET_STREAMING_MESSAGE:
      return { ...state, streamingMessage: action.payload };
    
    case actionTypes.ADD_TYPING_USER:
      return {
        ...state,
        typingUsers: [...state.typingUsers.filter(u => u.id !== action.payload.id), action.payload]
      };
    
    case actionTypes.REMOVE_TYPING_USER:
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u.id !== action.payload)
      };
    
    case actionTypes.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    
    case actionTypes.CLEAR_MESSAGES:
      return { ...state, messages: [], streamingMessage: '' };
    
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
      socket.on('message_chunk', (data) => {
        dispatch({ type: actionTypes.SET_STREAMING_MESSAGE, payload: state.streamingMessage + data.chunk });
      });

      socket.on('message_complete', (data) => {
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: data.message });
        dispatch({ type: actionTypes.SET_STREAMING, payload: false });
        dispatch({ type: actionTypes.SET_STREAMING_MESSAGE, payload: '' });
      });

      socket.on('new_message', (data) => {
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: data.message });
      });

      socket.on('message_updated', (data) => {
        dispatch({ type: actionTypes.UPDATE_MESSAGE, payload: data.message });
      });

      socket.on('message_deleted', (data) => {
        dispatch({ type: actionTypes.DELETE_MESSAGE, payload: data.messageId });
      });

      // Typing events
      socket.on('user_typing', (data) => {
        dispatch({ type: actionTypes.ADD_TYPING_USER, payload: data.user });
        
        // Remove typing indicator after timeout
        setTimeout(() => {
          dispatch({ type: actionTypes.REMOVE_TYPING_USER, payload: data.user.id });
        }, 3000);
      });

      socket.on('user_stopped_typing', (data) => {
        dispatch({ type: actionTypes.REMOVE_TYPING_USER, payload: data.userId });
      });

      // Thread events
      socket.on('thread_updated', (data) => {
        dispatch({ type: actionTypes.UPDATE_THREAD, payload: data.thread });
      });

      return () => {
        socket.off('message_chunk');
        socket.off('message_complete');
        socket.off('new_message');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('thread_updated');
      };
    }
  }, [socket, isConnected, state.streamingMessage]);

  // Actions
  const loadThreads = async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await chatService.getThreads(filters);
      
      if (response.success) {
        dispatch({ type: actionTypes.SET_THREADS, payload: response.data.threads });
        dispatch({ type: actionTypes.SET_PAGINATION, payload: response.data.pagination });
      } else {
        throw new Error(response.message || 'Failed to load threads');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load threads';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const createThread = async (threadData) => {
    try {
      const response = await chatService.createThread(threadData);
      
      if (response.success) {
        dispatch({ type: actionTypes.ADD_THREAD, payload: response.data.thread });
        addNotification({
          type: 'success',
          message: 'Thread created successfully'
        });
        return response.data.thread;
      } else {
        throw new Error(response.message || 'Failed to create thread');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create thread';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return null;
    }
  };

  const selectThread = async (thread) => {
    try {
      // Leave current thread
      if (state.currentThread) {
        leaveThread(state.currentThread._id);
      }
      
      // Set new current thread
      dispatch({ type: actionTypes.SET_CURRENT_THREAD, payload: thread });
      dispatch({ type: actionTypes.CLEAR_MESSAGES });
      
      // Join new thread
      if (thread) {
        joinThread(thread._id);
        
        // Load messages for the thread
        await loadMessages(thread._id);
      }
    } catch (error) {
      console.error('Error selecting thread:', error);
      addNotification({
        type: 'error',
        message: 'Failed to select thread'
      });
    }
  };

  const loadMessages = async (threadId, page = 1) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await chatService.getChatHistory(threadId, { page, limit: state.pagination.limit });
      
      if (response.success) {
        if (page === 1) {
          dispatch({ type: actionTypes.SET_MESSAGES, payload: response.data.messages });
        } else {
          dispatch({ type: actionTypes.SET_MESSAGES, payload: [...response.data.messages, ...state.messages] });
        }
        dispatch({ type: actionTypes.SET_PAGINATION, payload: response.data.pagination });
      } else {
        throw new Error(response.message || 'Failed to load messages');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load messages';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  const sendMessage = async (threadId, content) => {
    try {
      dispatch({ type: actionTypes.SET_STREAMING, payload: true });
      
      const response = await chatService.streamChat({
        threadId,
        message: content,
        model: 'google/gemini-2.5-flash-lite'
      });
      
      // The streaming response will be handled by socket events
      return response;
    } catch (error) {
      dispatch({ type: actionTypes.SET_STREAMING, payload: false });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send message';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return null;
    }
  };

  const deleteThread = async (threadId) => {
    try {
      const response = await chatService.deleteThread(threadId);
      
      if (response.success) {
        dispatch({ type: actionTypes.DELETE_THREAD, payload: threadId });
        addNotification({
          type: 'success',
          message: 'Thread deleted successfully'
        });
      } else {
        throw new Error(response.message || 'Failed to delete thread');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete thread';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    }
  };

  // Load threads when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadThreads();
    } else {
      dispatch({ type: actionTypes.SET_THREADS, payload: [] });
      dispatch({ type: actionTypes.SET_CURRENT_THREAD, payload: null });
      dispatch({ type: actionTypes.CLEAR_MESSAGES });
    }
  }, [isAuthenticated]);

  const value = {
    ...state,
    loadThreads,
    createThread,
    selectThread,
    loadMessages,
    sendMessage,
    deleteThread
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
