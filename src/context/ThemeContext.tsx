import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Garante que nenhuma classe dark persista e limpa localStorage
    const root = document.documentElement;
    root.classList.remove('dark');
    root.removeAttribute('data-theme');
    try {
      localStorage.removeItem('hype-tatu-theme');
    } catch (e) {}
  }, []);

  return <>{children}</>;
};

export const useTheme = () => ({
  theme: 'light' as const,
  toggleTheme: () => {},
  setTheme: () => {},
});
