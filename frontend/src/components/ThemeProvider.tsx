"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDarkMode: false, setIsDarkMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = (val: boolean) => {
    setIsDarkMode(val);
    localStorage.setItem("theme", val ? "dark" : "light");
    if (val) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode: toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
