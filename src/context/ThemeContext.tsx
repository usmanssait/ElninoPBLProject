import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kharif_app_theme');
      if (saved === 'dark' || saved === 'scientific') return 'dark';
      if (saved === 'light' || saved === 'agricultural') return 'light';
    }
    return 'light';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kharif_app_theme', newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
