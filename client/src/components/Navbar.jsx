import { Volume2, VolumeX } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import PlayButton from "./PlayButton";
import SearchButton from "./SearchButton";
import IdBadge from "./IdBadge";
import { playTickSound } from "../utils/sound";

const navLinks = [
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "about", label: "About", href: "#about" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "achievements", label: "Achievements", href: "#achievements" },
  { id: "blogs", label: "Blogs", href: "#blogs", badge: "new" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export default function Navbar() {
  // State: Controls whether the 3D Lanyard ID Badge is dropped
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  // Sound toggle state
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("soundMuted") === "true";
  });

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("soundMuted", String(next));
    if (!next) {
      playTickSound();
    }
  };

  // Horizontal position between "Connect" button and "Play" button
  const [badgeX, setBadgeX] = useState(null);
  // Exact visual dead-center of the open space to the left of the navbar dock
  const [leftX, setLeftX] = useState(null);

  const dockRef = useRef(null);

  const updateBadgePosition = useCallback(() => {
    const dockEl = dockRef.current || document.querySelector(".nav-shell");
    const rightControlsEl = document.querySelector(".nav-extra-right");
    if (dockEl) {
      const dockRect = dockEl.getBoundingClientRect();
      const leftMid = Math.max(175, dockRect.left / 2);
      setLeftX(leftMid);

      if (rightControlsEl) {
        const rightRect = rightControlsEl.getBoundingClientRect();
        const mid = (dockRect.right + rightRect.left) / 2;
        setBadgeX(mid);
      }
    }
  }, []);

  useEffect(() => {
    updateBadgePosition();
    const primeTimer = setTimeout(updateBadgePosition, 950);
    window.addEventListener("resize", updateBadgePosition);
    return () => {
      clearTimeout(primeTimer);
      window.removeEventListener("resize", updateBadgePosition);
    };
  }, [updateBadgePosition]);

  // Auto-drop the ID badge 2 seconds after website loads with smooth motion
  useEffect(() => {
    const timer = setTimeout(() => {
      updateBadgePosition();
      setIsBadgeOpen(true);
      playTickSound();
    }, 2000);
    return () => clearTimeout(timer);
  }, [updateBadgePosition]);

  return (
    <header className="navbar-wrapper">
      {/* Search and Play music controls placed outside navbar in the open space before "iyoush" */}
      <div
        className="nav-extra-left"
        style={leftX ? { left: `${leftX}px`, transform: "translate(-50%, -50%)" } : {}}
      >
        <SearchButton />
        <PlayButton />
      </div>

      <motion.div
        className="navbar-dock-container"
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          ref={dockRef}
          className="nav-shell"
        >
          {/* 1. Left Brand Monogram + "iyoush" */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playTickSound();
              updateBadgePosition();
              setIsBadgeOpen((prev) => !prev);
            }}
            className="nav-brand-group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            aria-label="Toggle ID Card Badge"
            title="Click to view ID Badge"
          >
            <div className="brand-mark">
              <img
                src="/navlogolight.png"
                alt="iyoush brand logo"
                className="brand-logo-img brand-logo-light"
              />
              <img
                src="/navlogodark.png"
                alt="iyoush brand logo"
                className="brand-logo-img brand-logo-dark"
              />
            </div>
            <span className="brand-name">iyoush</span>
          </motion.button>

          {/* 2. Middle Navigation Links with garvit.me styling */}
          <div className="nav-menu-list">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className="nav-link-item"
                onClick={() => playTickSound()}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="nav-badge-pill">{link.badge}</span>
                )}
              </a>
            ))}
          </div>

          {/* 3. Right Sound Toggle Speaker Button */}
          <div className="nav-right-controls">
            <button
              type="button"
              onClick={toggleSound}
              className="nav-sound-btn"
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
              title={isMuted ? "Sound off" : "Sound on"}
            >
              {isMuted ? (
                <VolumeX size={17} strokeWidth={1.8} />
              ) : (
                <Volume2 size={17} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </nav>
      </motion.div>

      {/* Action buttons placed outside navbar in the middle of the right space */}
      <div className="nav-extra-right">
        <ThemeToggle />
      </div>

      {/* 3D Drop-down Lanyard ID Card Badge */}
      <IdBadge
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
        anchorX={badgeX}
      />
    </header>
  );
}
