import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { playTickSound } from "../utils/sound";

export default function SearchButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMusicState = (e) => {
      if (e.detail) {
        setIsActive(Boolean(e.detail.isOpen && e.detail.isAskingArtist));
      }
    };
    window.addEventListener("music-player-state", handleMusicState);
    return () => window.removeEventListener("music-player-state", handleMusicState);
  }, []);

  const handleClick = () => {
    playTickSound();
    window.dispatchEvent(new CustomEvent("toggle-music-search"));
  };

  // Keyboard shortcut: Press "S" or "/" to toggle music search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "s" || e.key === "S" || e.key === "/") {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="search-btn-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`search-btn ${isActive ? "is-active" : ""}`}
        aria-label="Search music"
      >
        <img
          src="/search.png"
          alt="Search"
          className="search-btn-icon-img"
        />
      </button>

      {/* Floating Tooltip with Triangle Indicator */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="theme-tooltip"
          >
            <div className="tooltip-arrow" />
            <span>Search music (S)</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
