import { Send } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, useCallback } from "react";

const navLinks = [
  { id: "about", label: "About", href: "#about" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "achievements", label: "Achievements", href: "#achievements" },
  { id: "blogs", label: "Blogs", href: "#blogs" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export default function Navbar() {
  // State: Remembers whether the user has scrolled down the page
  const [scrolled, setScrolled] = useState(false);

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
      // Ignore if clicking a link or button directly
      if (e.target.closest("a")) return;
      isDragging.current = true;
      dragStartY.current = e.clientY;
      rawStretch.set(0);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [rawStretch]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging.current) return;
      const delta = e.clientY - dragStartY.current;
      // Rubber-band resistance: diminishing returns past threshold
      const maxStretch = 70;
      const dampened = (delta / (1 + Math.abs(delta) / maxStretch)) * 1.2;
      rawStretch.set(dampened);
    },
    [rawStretch]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    // Snap back — spring config overshoots for a juicy bounce
    rawStretch.set(0);
  }, [rawStretch]);

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
    // Cleanup: removes the listener when component unmounts
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="navbar-wrapper">
      <motion.nav
        /* --- Clockwise horizontal 360° spin entrance --- */
        initial={{ rotateY: 360, opacity: 0, y: -40, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, y: 0, scale: 1 }}
        transition={{
          rotateY: { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] },
          opacity: { duration: 0.5, delay: 0.1, ease: "easeOut" },
          y: { duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 1, ease: [0.16, 1, 0.3, 1] },
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
        onPointerLeave={handlePointerUp}
      >
        {/* 1. Brand Logo */}
        <a href="#" className="nav-brand">
          <span className="brand-name">
            iyoush<span className="gradient-gold">.dev</span>
          </span>
        </a>

        {/* 2. Navigation Links */}
        <ul className="nav-list">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a href={link.href} className="nav-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* 3. "Connect" CTA */}
        <a href="#contact" className="glass-button nav-cta">
          <span>Connect</span>
          <Send size={13} />
        </a>
      </motion.nav>
    </header>
  );
}
