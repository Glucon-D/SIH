import { createContext, useContext, useReducer, useEffect } from "react";

// Initial state
const initialState = {
  loading: false,
  error: null,
  notifications: [],
  isOnline: navigator.onLine,
  sidebarCollapsed: false,
  currentPage: "home",
};

// Action types
const actionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  REMOVE_NOTIFICATION: "REMOVE_NOTIFICATION",
  SET_ONLINE_STATUS: "SET_ONLINE_STATUS",
  TOGGLE_SIDEBAR: "TOGGLE_SIDEBAR",
  SET_CURRENT_PAGE: "SET_CURRENT_PAGE",
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            ...action.payload,
          },
        ],
      };

    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case actionTypes.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };

    case actionTypes.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case actionTypes.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  const addNotification = (notification) => {
    dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });

    // Auto remove after timeout
    if (notification.autoRemove !== false) {
      setTimeout(() => {
        removeNotification(notification.id || Date.now());
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id) => {
    dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: id });
  };

  const setOnlineStatus = (isOnline) => {
    dispatch({ type: actionTypes.SET_ONLINE_STATUS, payload: isOnline });
  };

  const toggleSidebar = () => {
    dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  };

  const setCurrentPage = (page) => {
    dispatch({ type: actionTypes.SET_CURRENT_PAGE, payload: page });
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem(
      import.meta.env.VITE_SIDEBAR_COLLAPSED_KEY || "dko_sidebar_collapsed"
    );
    if (savedSidebarState !== null) {
      dispatch({
        type: actionTypes.TOGGLE_SIDEBAR,
        payload: JSON.parse(savedSidebarState),
      });
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(
      import.meta.env.VITE_SIDEBAR_COLLAPSED_KEY || "dko_sidebar_collapsed",
      JSON.stringify(state.sidebarCollapsed)
    );
  }, [state.sidebarCollapsed]);

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification,
    setOnlineStatus,
    toggleSidebar,
    setCurrentPage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
