"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light" | "party";

const CONFETTI_COLORS = [
  "#f472b6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b",
  "#ef4444", "#ec4899", "#a855f7", "#3b82f6", "#14b8a6",
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isPartyActive, setIsPartyActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
      if (saved === "party") setIsPartyActive(true);
    }
  }, []);

  const spawnConfetti = useCallback(() => {
    const count = 50;
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.backgroundColor =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      confetti.style.animationDuration = `${2 + Math.random() * 3}s`;
      confetti.style.animationDelay = `${Math.random() * 1}s`;
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
      confetti.style.width = `${6 + Math.random() * 8}px`;
      confetti.style.height = `${6 + Math.random() * 8}px`;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 5000);
    }
  }, []);

  const switchTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "party") {
      setIsPartyActive(true);
      spawnConfetti();
    } else {
      setIsPartyActive(false);
    }
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={() => switchTheme("light")}
        className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
          theme === "light"
            ? "bg-amber-100 text-amber-600 shadow-lg shadow-amber-200/50 scale-110"
            : "hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
        }`}
        title="Light Mode"
        aria-label="Switch to light mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>

      <button
        onClick={() => switchTheme("dark")}
        className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
          theme === "dark"
            ? "bg-indigo-900/50 text-indigo-300 shadow-lg shadow-indigo-500/30 scale-110"
            : "hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
        }`}
        title="Dark Mode"
        aria-label="Switch to dark mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      <button
        onClick={() => switchTheme("party")}
        className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 cursor-pointer ${
          isPartyActive
            ? "bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-lg shadow-pink-500/30 scale-110"
            : "hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
        }`}
        title="Party Mode 🎉"
        aria-label="Switch to party mode"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L6 22h12L12 2z" />
          <line x1="12" y1="2" x2="14" y2="0" />
          <circle cx="15" cy="0" r="1" fill="currentColor" />
          <line x1="8" y1="14" x2="16" y2="14" />
          <line x1="7" y1="18" x2="17" y2="18" />
        </svg>
      </button>
    </div>
  );
}
