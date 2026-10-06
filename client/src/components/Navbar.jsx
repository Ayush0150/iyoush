import { Send } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import PlayButton from "./PlayButton";
import SearchButton from "./SearchButton";
import IdBadge from "./IdBadge";
import { playTickSound } from "../utils/sound";


const navLinks = [
  { id: "about", label: "About", href: "#about" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "achievements", label: "Achievements", href: "#achievements" },
  { id: "blogs", label: "Blogs", href: "#blogs" },
  { id: "contact", label: "Contact", href: "#contact" },
];

function getPerimeterPercent(x, y, w, h) {
  const r = h / 2;
  const straight = Math.max(0, w - 2 * r);
  const arc = Math.PI * r;
  const totalP = 2 * straight + 2 * arc;

  let dist = 0;
  if (x < r) {
    const dy = y - r;
    const dx = x - r;
    let angle = Math.atan2(dy, dx);
    let a = angle - Math.PI / 2;
    if (a < 0) a += 2 * Math.PI;
    dist = 2 * straight + arc + Math.min(arc, Math.max(0, a * r));
  } else if (x > w - r) {
    const dy = y - r;
    const dx = x - (w - r);
    const angle = Math.atan2(dy, dx);
    const a = angle + Math.PI / 2;
    dist = straight + Math.min(arc, Math.max(0, a * r));
  } else {
    if (y <= r) {
      dist = x - r;
    } else {
      dist = straight + arc + (w - r - x);
    }
  }

  return (dist / totalP) * 100;
}

export default function Navbar() {
  // State: Remembers whether the user has scrolled down the page
  const [scrolled, setScrolled] = useState(false);

  // State: Controls whether the 3D Lanyard ID Badge is dropped
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  // Horizontal position between "Connect" button and "Play" button
  const [badgeX, setBadgeX] = useState(null);
  // Exact visual dead-center of the open space to the left of the navbar dock
  const [leftX, setLeftX] = useState(null);

  const updateBadgePosition = useCallback(() => {
    const dockEl = dockRef.current || document.querySelector(".navbar-dock");
    const rightControlsEl = document.querySelector(".nav-extra-right");
    if (dockEl) {
      const dockRect = dockEl.getBoundingClientRect();
      // True visual dead-center of the open space to the left of the navbar dock
      // Maintain at least 175px clearance so the 330px centered card has clean left margins
      const leftMid = Math.max(175, dockRect.left / 2);
      setLeftX(leftMid);

      if (rightControlsEl) {
        const rightRect = rightControlsEl.getBoundingClientRect();
        // Exact visual dead-center between the navbar dock's right edge and the right controls (Theme/Search)
        const mid = (dockRect.right + rightRect.left) / 2;
        setBadgeX(mid);
      }
    }
  }, []);

  useEffect(() => {
    updateBadgePosition();
    // Re-measure after navbar entrance animation settles
    const primeTimer = setTimeout(updateBadgePosition, 950);
    window.addEventListener("resize", updateBadgePosition);
    return () => {
      clearTimeout(primeTimer);
      window.removeEventListener("resize", updateBadgePosition);
    };
  }, [updateBadgePosition]);

  // Auto-drop the ID badge 2 seconds after website loads with butter-smooth motion
  useEffect(() => {
    const timer = setTimeout(() => {
      updateBadgePosition();
      setIsBadgeOpen(true);
      playTickSound();
    }, 2000);
    return () => clearTimeout(timer);
  }, [updateBadgePosition]);

  // References for interactive snake beam tracking
  const dockRef = useRef(null);
  const snakeRef = useRef(null);
  const isHoveredRef = useRef(false);
  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);

  // --- Rubber-band stretch logic (applied to entire dock) ---
  const isDragging = useRef(false);
  const dragStartY = useRef(0);

  // Raw drag offset
  const rawStretch = useMotionValue(0);

  // Springy value that snaps back with velvety fluid cushion
  const stretchY = useSpring(rawStretch, {
    stiffness: 180,
    damping: 22,
    mass: 0.6,
  });

  // Map drag → subtle 3D bend transforms (NO size change — smooth silicone flex)
  const rotateX = useTransform(stretchY, [-50, 0, 50], [10, 0, -10]);
  const rotateZ = useTransform(stretchY, [-50, 0, 50], [-1.2, 0, 1.2]);
  const translateY = useTransform(stretchY, [-50, 0, 50], [-3, 0, 3]);

  const handlePointerDown = useCallback(
    (e) => {
      // Ignore if clicking a link, button, or input directly
      if (e.target.closest("a, button, input")) return;
      isDragging.current = true;
      dragStartY.current = e.clientY;
      rawStretch.set(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [rawStretch]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (isDragging.current) {
        const delta = e.clientY - dragStartY.current;
        const maxStretch = 70;
        const dampened = (delta / (1 + Math.abs(delta) / maxStretch)) * 1.2;
        rawStretch.set(dampened);
        return;
      }

      // Smooth parallel snake beam mouse tracking
      if (dockRef.current) {
        isHoveredRef.current = true;
        const rect = dockRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        targetOffsetRef.current = getPerimeterPercent(x, y, rect.width, rect.height);
      }
    },
    [rawStretch]
  );

  const handlePointerEnter = useCallback((e) => {
    if (dockRef.current) {
      isHoveredRef.current = true;
      const rect = dockRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetOffsetRef.current = getPerimeterPercent(x, y, rect.width, rect.height);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    isDragging.current = false;
    rawStretch.set(0);
    isHoveredRef.current = false;
  }, [rawStretch]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    rawStretch.set(0);
  }, [rawStretch]);

  // High-performance RAF loop for snake beam parallel movement & ambient glide
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const delta = Math.min(64, time - lastTime);
      lastTime = time;

      if (isHoveredRef.current) {
        // Find shortest angular path across 100% loop
        let diff = (targetOffsetRef.current - currentOffsetRef.current) % 100;
        if (diff > 50) diff -= 100;
        if (diff < -50) diff += 100;

        // Fluid spring lerp towards cursor position
        currentOffsetRef.current = (currentOffsetRef.current + diff * 0.16 + 100) % 100;
      } else {
        // Continuous ambient clockwise glide (~14s full loop at 60fps)
        const speed = (delta / 16.67) * 0.11;
        currentOffsetRef.current = (currentOffsetRef.current + speed) % 100;
      }

      if (snakeRef.current) {
        snakeRef.current.style.setProperty(
          "--snake-distance",
          `${currentOffsetRef.current.toFixed(2)}%`
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Effect: Attaches a window scroll listener when page loads
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [hoveredIndex, setHoveredIndex] = useState(null);

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
        /* --- Silky Apple 3D Entrance: Butter-Smooth Glide --- */
        initial={{
          opacity: 0,
          y: -26,
          scale: 0.96,
          rotateX: -10,
          rotateY: 6,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
        }}
        transition={{
          duration: 0.88,
          ease: [0.16, 1, 0.3, 1], // Apple luxury fluid deceleration
          opacity: { duration: 0.5, ease: "easeOut" },
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
          perspective: 1400,
        }}
      >
        <motion.nav
          ref={dockRef}
          /* --- Rubber-band BEND transforms (active on drag) --- */
          style={{
            rotateX,
            rotateZ,
            y: translateY,
            transformOrigin: "center center",
            transformStyle: "preserve-3d",
          }}
          className={`navbar-dock glass-panel ${scrolled ? "dock-scrolled" : ""}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerEnter={handlePointerEnter}
        >
          {/* Luminous Clockwise Snake Border Beam */}
          <div ref={snakeRef} className="navbar-snake-beam" aria-hidden="true" />

          {/* 1. Brand Logo (Click to drop 3D ID Badge) */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playTickSound();
              updateBadgePosition();
              setIsBadgeOpen((prev) => !prev);
            }}
            className="nav-brand nav-brand-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            aria-label="Toggle ID Card Badge"
            title="Click to view ID Badge"
          >
            <span className="gradient-gold brand-name">iyoush</span>
          </motion.button>

          {/* 2. Navigation Links with Sliding Glass Hover Pill */}
          <ul
            className="nav-list"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {navLinks.map((link, idx) => (
              <li key={link.id} className="nav-item">
                <a
                  href={link.href}
                  className={`nav-link ${hoveredIndex === idx ? "active-hover" : ""}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  <span className="nav-link-label">{link.label}</span>
                  {hoveredIndex === idx && (
                    <motion.div
                      layoutId="navbar-hover-pill"
                      className="nav-hover-pill"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                      }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* 3. "Connect" CTA with Micro-interactions */}
          <motion.a
            href="#contact"
            className="glass-button nav-cta"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <span>Connect</span>
            <motion.span
              className="nav-cta-icon"
              whileHover={{ x: 2, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Send size={12} />
            </motion.span>
          </motion.a>
        </motion.nav>
      </motion.div>

      {/* Action buttons placed outside navbar in the middle of the right space */}
      <div className="nav-extra-right">
        <ThemeToggle />
      </div>

      {/* 3D Drop-down Lanyard ID Card Badge anchored in the Connect-Play gap */}
      <IdBadge
        isOpen={isBadgeOpen}
        onClose={() => setIsBadgeOpen(false)}
        anchorX={badgeX}
      />
    </header>
  );
}
