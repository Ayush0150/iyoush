import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { playTickSound } from "../utils/sound";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("dark-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    playTickSound();
    setRotation((prev) => prev + 180);
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Keyboard shortcut: Press "D" to toggle theme
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target?.tagName)) return;
      if (e.key === "d" || e.key === "D") {
        toggleTheme();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      className={`figma-theme-toggle ${isDark ? "is-dark" : "is-light"} ${isHovered ? "is-hovered" : ""}`}
      aria-label={`Switch theme (currently ${isDark ? "Dark" : "Light"})`}
    >
      {/* Figma Swatches & Circular Swap Arrows */}
      <div className="figma-theme-icon-wrap">
        <svg
          width="24"
          height="22"
          viewBox="0 0 24 22"
          fill="none"
          className="figma-theme-icon"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bottom-Right Outline Swatch (Rendered behind) */}
          <rect
            x="7.5"
            y="7.5"
            width="12"
            height="12"
            rx="2.8"
            stroke={isDark ? "#ffffff" : "#18181b"}
            strokeWidth="1.6"
            fill={isDark ? "#18181b" : "#ffffff"}
          />

          {/* Top-Left Solid Swatch (Rendered on top) */}
          <rect
            x="1.5"
            y="1.5"
            width="12"
            height="12"
            rx="2.8"
            fill={isDark ? "#ffffff" : "#18181b"}
          />

          {/* Circular Swap Arrows nestled in top-right */}
          <motion.g
            className="figma-swap-arrows"
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            style={{ transformOrigin: "18.6px 4.2px" }}
          >
            {/* Top clockwise arc + arrowhead */}
            <path
              d="M 16.0 3.8 C 16.5 2.2 17.5 1.3 18.8 1.3 C 20.3 1.3 21.4 2.2 21.7 3.8"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.25"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 19.8 3.8 L 21.7 3.8 L 21.7 1.9"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Bottom clockwise arc + arrowhead */}
            <path
              d="M 21.2 4.6 C 20.7 6.2 19.7 7.1 18.4 7.1 C 16.9 7.1 15.8 6.2 15.5 4.6"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.25"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 17.4 4.6 L 15.5 4.6 L 15.5 6.5"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </motion.g>
        </svg>
      </div>

      {/* Theme Label (Dark / Light) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.15 }}
          className="figma-theme-label"
        >
          {isDark ? "Dark" : "Light"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
