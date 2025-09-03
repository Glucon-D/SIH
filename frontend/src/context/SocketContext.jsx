import { createContext, useContext, useEffect, useReducer } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useApp } from "./AppContext";

// Initial state
const initialState = {
  socket: null,
  isConnected: false,
  connectionError: null,
  reconnectAttempts: 0,
};

// Action types
const actionTypes = {
  SET_SOCKET: "SET_SOCKET",
  SET_CONNECTED: "SET_CONNECTED",
  SET_CONNECTION_ERROR: "SET_CONNECTION_ERROR",
  INCREMENT_RECONNECT_ATTEMPTS: "INCREMENT_RECONNECT_ATTEMPTS",
  RESET_RECONNECT_ATTEMPTS: "RESET_RECONNECT_ATTEMPTS",
};

// Reducer
const socketReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_SOCKET:
      return { ...state, socket: action.payload };

    case actionTypes.SET_CONNECTED:
      return { ...state, isConnected: action.payload };

    case actionTypes.SET_CONNECTION_ERROR:
      return { ...state, connectionError: action.payload };

    case actionTypes.INCREMENT_RECONNECT_ATTEMPTS:
      return { ...state, reconnectAttempts: state.reconnectAttempts + 1 };

    case actionTypes.RESET_RECONNECT_ATTEMPTS:
      return { ...state, reconnectAttempts: 0 };

    default:
      return state;
  }
};

// Create context
const SocketContext = createContext();

// Provider component
export const SocketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(socketReducer, initialState);
  const { isAuthenticated, token } = useAuth();
  const { addNotification } = useApp();

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token) {
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL || "http://localhost:5010";

      const socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      dispatch({ type: actionTypes.SET_SOCKET, payload: socket });

      // Connection event handlers
      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
        dispatch({ type: actionTypes.SET_CONNECTED, payload: true });
        dispatch({ type: actionTypes.SET_CONNECTION_ERROR, payload: null });
        dispatch({ type: actionTypes.RESET_RECONNECT_ATTEMPTS });

        addNotification({
          type: "success",
          message: "Connected to server",
          duration: 2000,
        });
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        dispatch({ type: actionTypes.SET_CONNECTED, payload: false });

        if (reason === "io server disconnect") {
          // Server disconnected the socket, need to reconnect manually
          socket.connect();
        }

        addNotification({
          type: "warning",
          message: "Disconnected from server",
          duration: 3000,
        });
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        dispatch({
          type: actionTypes.SET_CONNECTION_ERROR,
          payload: error.message,
        });
        dispatch({ type: actionTypes.INCREMENT_RECONNECT_ATTEMPTS });

        addNotification({
          type: "error",
          message: "Connection error. Retrying...",
          duration: 3000,
        });
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        dispatch({ type: actionTypes.RESET_RECONNECT_ATTEMPTS });

        addNotification({
          type: "success",
          message: "Reconnected to server",
          duration: 2000,
        });
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
        dispatch({
          type: actionTypes.SET_CONNECTION_ERROR,
          payload: "Reconnection failed",
        });

        addNotification({
          type: "error",
          message: "Failed to reconnect to server",
          duration: 5000,
        });
      });

      // Custom event handlers
      socket.on("notification", (data) => {
        addNotification({
          type: data.type || "info",
          message: data.message,
          duration: data.duration || 4000,
        });
      });

      socket.on("user_joined", (data) => {
        console.log("User joined:", data);
      });

      socket.on("user_left", (data) => {
        console.log("User left:", data);
      });

      // Cleanup on unmount
      return () => {
        console.log("Cleaning up socket connection");
        socket.disconnect();
        dispatch({ type: actionTypes.SET_SOCKET, payload: null });
        dispatch({ type: actionTypes.SET_CONNECTED, payload: false });
      };
    } else {
      // Clean up socket if not authenticated
      if (state.socket) {
        state.socket.disconnect();
        dispatch({ type: actionTypes.SET_SOCKET, payload: null });
        dispatch({ type: actionTypes.SET_CONNECTED, payload: false });
      }
    }
  }, [isAuthenticated, token]);

  // Socket utility functions
  const joinThread = (threadId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit("join_thread", threadId);
    }
  };

  const leaveThread = (threadId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit("leave_thread", threadId);
    }
  };

  const sendMessage = (threadId, message) => {
    if (state.socket && state.isConnected) {
      state.socket.emit("send_message", { threadId, message });
    }
  };

  const emitTyping = (threadId, isTyping) => {
    if (state.socket && state.isConnected) {
      state.socket.emit("typing", { threadId, isTyping });
    }
  };

  const value = {
    ...state,
    joinThread,
    leaveThread,
    sendMessage,
    emitTyping,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
