import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'gcg-inv-theme';

// Get system theme preference
const getSystemTheme = (): ActualTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get stored theme or default
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

// Calculate actual theme based on preference
const calculateActualTheme = (theme: Theme): ActualTheme => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [actualTheme, setActualTheme] = useState<ActualTheme>(() => 
    calculateActualTheme(getStoredTheme())
  );

  // Update actual theme when theme changes
  useEffect(() => {
    const newActualTheme = calculateActualTheme(theme);
    setActualTheme(newActualTheme);
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newActualTheme);
    
    // Set data attribute for CSS
    document.documentElement.setAttribute('data-theme', newActualTheme);
    
    // Store preference
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newActualTheme = e.matches ? 'dark' : 'light';
      setActualTheme(newActualTheme);
      
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newActualTheme);
      document.documentElement.setAttribute('data-theme', newActualTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to get theme-aware classes
export function getThemeClasses(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`;
}

// Hook for theme-aware styling
export function useThemeClasses() {
  const { actualTheme } = useTheme();
  
  return {
    bg: actualTheme === 'light' ? 'bg-white' : 'bg-gray-900',
    text: actualTheme === 'light' ? 'text-gray-900' : 'text-white',
    border: actualTheme === 'light' ? 'border-gray-200' : 'border-gray-700',
    card: actualTheme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700',
    input: actualTheme === 'light' 
      ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' 
      : 'bg-gray-800 border-gray-600 text-white placeholder-gray-400',
    button: {
      primary: actualTheme === 'light' 
        ? 'bg-black text-white hover:bg-gray-800' 
        : 'bg-white text-black hover:bg-gray-200',
      secondary: actualTheme === 'light' 
        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' 
        : 'bg-gray-700 text-white hover:bg-gray-600',
    }
  };
}