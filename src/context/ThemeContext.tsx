import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark-black' | 'dark-blue';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'hype_theme_mode_v3';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
      if (saved === 'light' || saved === 'dark-black' || saved === 'dark-blue') {
        return saved;
      }
    } catch {}
    return 'dark-blue'; // Padrão: escuro azulado atual
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const cycleTheme = () => {
    if (theme === 'dark-blue') setTheme('dark-black');
    else if (theme === 'dark-black') setTheme('light');
    else setTheme('dark-blue');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'dark-blue' as AppTheme,
      setTheme: () => {},
      cycleTheme: () => {},
    };
  }
  return ctx;
};
