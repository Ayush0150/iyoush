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
          width="26"
          height="24"
          viewBox="0 0 26 24"
          fill="none"
          className="figma-theme-icon"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bottom-Right Outline Swatch (Rendered behind) */}
          <rect
            x="8"
            y="8"
            width="13.5"
            height="13.5"
            rx="2.8"
            stroke={isDark ? "#ffffff" : "#18181b"}
            strokeWidth="1.8"
            fill={isDark ? "#18181b" : "#ffffff"}
          />

          {/* Top-Left Solid Swatch (Rendered on top) */}
          <rect
            x="1.5"
            y="1.5"
            width="13.5"
            height="13.5"
            rx="2.8"
            fill={isDark ? "#ffffff" : "#18181b"}
          />

          {/* Circular Swap Arrows in Top-Right */}
          <motion.g
            className="figma-swap-arrows"
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            style={{ transformOrigin: "19.8px 5.5px" }}
          >
            {/* Top clockwise arc + arrowhead */}
            <path
              d="M 16.6 4.3 C 17.3 2.7 18.5 1.9 20 1.9 C 21.7 1.9 23 3 23.3 4.8"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 21.3 4.8 L 23.3 4.8 L 23.3 2.8"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Bottom clockwise arc + arrowhead */}
            <path
              d="M 23 6.7 C 22.3 8.3 21.1 9.1 19.6 9.1 C 17.9 9.1 16.6 8 16.3 6.2"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 18.3 6.2 L 16.3 6.2 L 16.3 8.2"
              stroke={isHovered ? "#0b99ff" : isDark ? "#a1a1aa" : "#71717a"}
              strokeWidth="1.3"
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
