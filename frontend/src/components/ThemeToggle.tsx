"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { isDarkMode, setIsDarkMode } = useTheme();

  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className={`fixed top-5 right-6 z-[60] p-2.5 rounded-full transition-colors border shadow-sm flex items-center justify-center ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
          : 'bg-white border-gray-200 text-slate-800 hover:bg-gray-50'
      }`}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
