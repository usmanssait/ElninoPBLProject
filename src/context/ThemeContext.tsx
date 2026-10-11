import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'scientific' | 'agricultural';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'agricultural',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('kharif_app_theme');
    return (saved === 'scientific' || saved === 'agricultural') ? saved : 'agricultural';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('kharif_app_theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'agricultural' ? 'scientific' : 'agricultural');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'agricultural') {
      root.classList.add('theme-agricultural');
      root.classList.remove('theme-scientific');
    } else {
      root.classList.add('theme-scientific');
      root.classList.remove('theme-agricultural');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
