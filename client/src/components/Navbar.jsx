import { Send } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, useCallback } from "react";
import ThemeToggle from "./ThemeToggle";
import PlayButton from "./PlayButton";
import SearchButton from "./SearchButton";


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

  // Springy value that snaps back with satisfying overshoot bounce
  const stretchY = useSpring(rawStretch, {
    stiffness: 300,
    damping: 10,
    mass: 0.4,
  });

  // Map drag → 3D bend transforms (NO size change — only rotation in 3D space)
  const rotateX = useTransform(stretchY, [-60, 0, 60], [25, 0, -25]);
  const rotateZ = useTransform(stretchY, [-60, 0, 60], [-2, 0, 2]);
  const translateY = useTransform(stretchY, [-60, 0, 60], [-3, 0, 3]);

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
      <motion.nav
        ref={dockRef}
        /* --- Clockwise horizontal 360° spin entrance --- */
        initial={{ rotateY: 360, opacity: 0, y: -30, scale: 0.94 }}
        animate={{ rotateY: 0, opacity: 1, y: 0, scale: 1 }}
        transition={{
          rotateY: { duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] },
          opacity: { duration: 0.5, delay: 0.1, ease: "easeOut" },
          y: { duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
        }}
        /* --- Rubber-band BEND transforms (size stays constant) --- */
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

        {/* 1. Brand Logo */}
        <motion.a
          href="#"
          className="nav-brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="gradient-gold brand-name">iyoush</span>
        </motion.a>

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

      {/* Action buttons placed outside navbar in the middle of the right space */}
      <div className="nav-extra-right">
        <PlayButton />
        <ThemeToggle />
        <SearchButton />
      </div>
    </header>
  );
}
