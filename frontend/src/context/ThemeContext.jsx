import { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  theme: 'light', // 'light' | 'dark' | 'system'
  systemTheme: 'light',
  effectiveTheme: 'light' // The actual theme being used
};

// Action types
const actionTypes = {
  SET_THEME: 'SET_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
  UPDATE_EFFECTIVE_THEME: 'UPDATE_EFFECTIVE_THEME'
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case actionTypes.SET_SYSTEM_THEME:
      return {
        ...state,
        systemTheme: action.payload
      };
    
    case actionTypes.UPDATE_EFFECTIVE_THEME:
      return {
        ...state,
        effectiveTheme: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Actions
  const setTheme = (theme) => {
    dispatch({ type: actionTypes.SET_THEME, payload: theme });
    
    // Save to localStorage
    localStorage.setItem(
      import.meta.env.VITE_THEME_STORAGE_KEY || 'dko_theme',
      theme
    );
  };

  const toggleTheme = () => {
    const newTheme = state.effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setSystemTheme = (systemTheme) => {
    dispatch({ type: actionTypes.SET_SYSTEM_THEME, payload: systemTheme });
  };

  const updateEffectiveTheme = () => {
    let effectiveTheme;
    
    if (state.theme === 'system') {
      effectiveTheme = state.systemTheme;
    } else {
      effectiveTheme = state.theme;
    }
    
    dispatch({ type: actionTypes.UPDATE_EFFECTIVE_THEME, payload: effectiveTheme });
    
    // Apply theme to document
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem(
      import.meta.env.VITE_THEME_STORAGE_KEY || 'dko_theme'
    );
    
    // Get system theme preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Set initial theme
    const initialTheme = savedTheme || import.meta.env.VITE_DEFAULT_THEME || 'system';
    
    dispatch({ type: actionTypes.SET_THEME, payload: initialTheme });
    dispatch({ type: actionTypes.SET_SYSTEM_THEME, payload: systemTheme });
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(systemTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Update effective theme when theme or system theme changes
  useEffect(() => {
    updateEffectiveTheme();
  }, [state.theme, state.systemTheme]);

  const value = {
    ...state,
    setTheme,
    toggleTheme,
    isDark: state.effectiveTheme === 'dark',
    isLight: state.effectiveTheme === 'light',
    isSystem: state.theme === 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
