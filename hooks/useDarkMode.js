import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * @type {React.Context<{
 *   theme: 'system' | 'light' | 'dark';
 *   darkMode: boolean;
 *   setTheme: (newTheme: 'system' | 'light' | 'dark') => void;
 * }>}
 */
const ThemeContext = createContext({
  theme: 'system',
  darkMode: false,
  setTheme: (newTheme) => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('system');
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      setThemeState(saved);
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mediaQuery.matches);

    const handleChange = (e) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light' || newTheme === 'system') {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  }, []);

  const darkMode = theme === 'dark' ? true : theme === 'light' ? false : systemDark;

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [darkMode, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, darkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export const useDarkMode = () => {
  const context = useContext(ThemeContext);
  if (context && typeof context.darkMode === 'boolean') {
    return context.darkMode;
  }
  const [fallbackDark, setFallbackDark] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setFallbackDark(mediaQuery.matches);
  }, []);
  return fallbackDark;
};
