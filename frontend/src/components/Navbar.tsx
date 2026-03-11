"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export function Navbar() {
  const { isDarkMode } = useTheme();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Chatbot", href: "/chatbot" },
  ];

  const logoColor = isDarkMode ? "text-white" : "text-foreground";
  const linkColor = isDarkMode ? "text-slate-200 hover:text-white" : "text-foreground/80 hover:text-foreground";
  const underlineColor = isDarkMode ? "bg-white" : "bg-foreground";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent px-8 py-6 flex justify-between items-center max-w-7xl mx-auto left-1/2 -translate-x-1/2">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className={`font-bold text-2xl tracking-tight transition-opacity hover:opacity-80 ${logoColor}`}>
          ArogyAI
        </Link>
      </div>

      {/* Center Links perfectly centered */}
      <div className={`absolute left-1/2 -translate-x-1/2 hidden md:flex gap-8 items-center font-bold text-lg ${linkColor}`}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="relative group transition-colors"
          >
            {link.name}
            <span className={`absolute -bottom-1 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${underlineColor}`}></span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
