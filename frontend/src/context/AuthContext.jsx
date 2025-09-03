import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';
import { useApp } from './AppContext';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true
};

// Action types
const actionTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false
      };
    
    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case actionTypes.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { addNotification, setError } = useApp();

  // Actions
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'dko_auth_token',
          token
        );
        localStorage.setItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token',
          refreshToken
        );
        
        dispatch({
          type: actionTypes.LOGIN_SUCCESS,
          payload: { user, token, refreshToken }
        });
        
        addNotification({
          type: 'success',
          message: 'Login successful!'
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await authService.register(userData);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens in localStorage
        localStorage.setItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'dko_auth_token',
          token
        );
        localStorage.setItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token',
          refreshToken
        );
        
        dispatch({
          type: actionTypes.LOGIN_SUCCESS,
          payload: { user, token, refreshToken }
        });
        
        addNotification({
          type: 'success',
          message: 'Registration successful!'
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens from localStorage
      localStorage.removeItem(import.meta.env.VITE_JWT_STORAGE_KEY || 'dko_auth_token');
      localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token');
      
      dispatch({ type: actionTypes.LOGOUT });
      
      addNotification({
        type: 'success',
        message: 'Logged out successfully'
      });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: actionTypes.UPDATE_USER,
          payload: response.data.user
        });
        
        addNotification({
          type: 'success',
          message: 'Profile updated successfully'
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem(
        import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token'
      );
      
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authService.refreshToken(storedRefreshToken);
      
      if (response.success) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Update tokens in localStorage
        localStorage.setItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'dko_auth_token',
          token
        );
        localStorage.setItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token',
          newRefreshToken
        );
        
        dispatch({
          type: actionTypes.REFRESH_TOKEN_SUCCESS,
          payload: { token, refreshToken: newRefreshToken }
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Force logout if refresh fails
      return { success: false, error: error.message };
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || 'dko_auth_token'
        );
        const storedRefreshToken = localStorage.getItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || 'dko_refresh_token'
        );
        
        if (token && storedRefreshToken) {
          // Verify token and get user profile
          const response = await authService.getProfile();
          
          if (response.success) {
            dispatch({
              type: actionTypes.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token,
                refreshToken: storedRefreshToken
              }
            });
          } else {
            // Token might be expired, try to refresh
            await refreshToken();
          }
        } else {
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
