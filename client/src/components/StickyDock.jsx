import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { playTickSound } from "../utils/sound";

const EMAIL_ADDRESS = "ayushrai1509@gmail.com";
const GITHUB_URL = "https://github.com/Ayush0150";
const TWITTER_URL = "https://x.com/Ayush0150";

export default function StickyDock() {
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    playTickSound();
    const timer = setTimeout(() => setToastMessage(null), 2400);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText(EMAIL_ADDRESS).then(() => {
      showToast("Email copied to clipboard!");
    }).catch(() => {
      window.location.href = `mailto:${EMAIL_ADDRESS}`;
    });
  }, [showToast]);

  // Global "Press C to copy email" keyboard shortcut (matching figmaebae)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "c" || e.key === "C") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      ) {
        handleCopyEmail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopyEmail]);

  return (
    <>
      {/* Toast Notification Container (Dead Center) */}
      <div className="dock-toast-wrapper">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="dock-toast"
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
            >
              <span className="dock-toast-dot" />
              <span className="dock-toast-text">{toastMessage}</span>
              <span className="dock-toast-email">{EMAIL_ADDRESS}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Dock Container (Dead Center) */}
      <div className="sticky-dock-wrapper">
        <motion.nav
          className="sticky-bottom-dock"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 26, delay: 0.3 }}
          aria-label="Sticky Quick Actions Dock"
        >
        {/* Group of Left Icons */}
        <div className="dock-icons-group">
          {/* Email Action */}
          <div className="dock-item-wrap">
            <motion.button
              type="button"
              className="dock-icon-btn"
              onClick={handleCopyEmail}
              onMouseEnter={() => setActiveTooltip("email")}
              onMouseLeave={() => setActiveTooltip(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Copy Email (Press C)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </motion.button>
            <AnimatePresence>
              {activeTooltip === "email" && (
                <motion.div
                  className="dock-tooltip"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                >
                  <span>Email</span>
                  <span className="dock-tooltip-kbd">C</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GitHub Action */}
          <div className="dock-item-wrap">
            <motion.a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="dock-icon-btn"
              onMouseEnter={() => setActiveTooltip("git")}
              onMouseLeave={() => setActiveTooltip(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="GitHub Profile"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </motion.a>
            <AnimatePresence>
              {activeTooltip === "git" && (
                <motion.div
                  className="dock-tooltip"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                >
                  <span>GitHub</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Twitter / X Action */}
          <div className="dock-item-wrap">
            <motion.a
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="dock-icon-btn"
              onMouseEnter={() => setActiveTooltip("twitter")}
              onMouseLeave={() => setActiveTooltip(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Twitter / X Profile"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </motion.a>
            <AnimatePresence>
              {activeTooltip === "twitter" && (
                <motion.div
                  className="dock-tooltip"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                >
                  <span>Twitter / X</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="dock-divider" />

        {/* Blue Resume Button (Exact figmaebae styling) */}
        <motion.a
          href="#resume"
          className="dock-resume-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => playTickSound()}
        >
          Resume
        </motion.a>
      </motion.nav>
    </div>
  </>
);
}
