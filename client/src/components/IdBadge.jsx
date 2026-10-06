import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playTickSound } from "../utils/sound";

export default function IdBadge({ isOpen, onClose, anchorX = null }) {
  const [isPhotoColor, setIsPhotoColor] = useState(false);
  const [ageDecimal, setAgeDecimal] = useState("00000000");
  const rotateY = useMotionValue(0);
  const currentAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartAngleRef = useRef(0);
  const hasMovedRef = useRef(false);
  const activeAnimationRef = useRef(null);

  // Dynamic face visibility to completely eliminate 3D bleed-through glitch
  const frontOpacity = useTransform(rotateY, (r) => {
    const norm = ((r % 360) + 360) % 360;
    return norm > 89 && norm < 271 ? 0 : 1;
  });
  const backOpacity = useTransform(rotateY, (r) => {
    const norm = ((r % 360) + 360) % 360;
    return norm > 89 && norm < 271 ? 1 : 0;
  });
  const frontVisibility = useTransform(rotateY, (r) => {
    const norm = ((r % 360) + 360) % 360;
    return norm > 89 && norm < 271 ? "hidden" : "visible";
  });
  const backVisibility = useTransform(rotateY, (r) => {
    const norm = ((r % 360) + 360) % 360;
    return norm > 89 && norm < 271 ? "visible" : "hidden";
  });

  // Precise Live Age Counter (Born March 16, 2005)
  useEffect(() => {
    if (!isOpen) return;
    const birth = new Date(2005, 2, 16, 0, 0, 0).getTime();
    const yearMs = 365.2425 * 24 * 60 * 60 * 1000;

    const updateAge = () => {
      const now = Date.now();
      const diff = now - birth;
      const yearFraction = (diff / yearMs) % 1;
      setAgeDecimal(yearFraction.toFixed(8).slice(2));
    };

    updateAge();
    const timer = setInterval(updateAge, 35);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        playTickSound();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Initial entrance 3D rotation animation when badge drops in
  useEffect(() => {
    if (isOpen) {
      rotateY.set(0);
      currentAngleRef.current = 0;
      const anim = animate(rotateY, [0, 180, 180, 360], {
        delay: 0.45,
        duration: 2.6,
        times: [0, 0.4, 0.6, 1],
        ease: ["easeInOut", "linear", "easeInOut"],
        onComplete: () => {
          currentAngleRef.current = 360;
        },
      });
      activeAnimationRef.current = anim;
      return () => anim.stop();
    }
  }, [isOpen, rotateY]);

  // Interactive mouse drag to flip card in that direction
  const handlePointerDown = useCallback(
    (e) => {
      // Don't drag if user clicked buttons, links, or close button
      if (e.target.closest("button, a, input")) return;

      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
      }

      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartXRef.current = e.clientX;
      dragStartAngleRef.current = rotateY.get();

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    },
    [rotateY]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - dragStartXRef.current;
      if (Math.abs(deltaX) > 4) {
        hasMovedRef.current = true;
      }
      // Follow mouse horizontally with silky 3D rotation
      rotateY.set(dragStartAngleRef.current + deltaX * 0.7);
    },
    [rotateY]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      const deltaX = e.clientX - dragStartXRef.current;
      const cur = rotateY.get();

      let targetAngle;
      if (Math.abs(deltaX) > 35) {
        // Dragged in a direction: flip 180 degrees in that direction!
        if (deltaX > 0) {
          targetAngle = Math.round((dragStartAngleRef.current + 180) / 180) * 180;
        } else {
          targetAngle = Math.round((dragStartAngleRef.current - 180) / 180) * 180;
        }
        playTickSound();
      } else if (!hasMovedRef.current) {
        // Direct click on card: flip to other side!
        targetAngle = Math.round((cur + 180) / 180) * 180;
        playTickSound();
      } else {
        // Below drag threshold: snap to closest 180 face
        targetAngle = Math.round(cur / 180) * 180;
      }

      currentAngleRef.current = targetAngle;
      activeAnimationRef.current = animate(rotateY, targetAngle, {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
      });
    },
    [rotateY]
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="id-badge-overlay">
          {/* The Hanging Lanyard Rig: Smooth Descent without hesitation */}
          <motion.div
            className="id-badge-rig"
            onClick={(e) => e.stopPropagation()}
            style={{
              left: anchorX ? `${anchorX}px` : "50%",
              x: "-50%",
            }}
            initial={{
              y: "-110vh",
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                y: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.22, ease: "easeOut" },
              },
            }}
            exit={{
              y: "-110vh",
              opacity: 0,
              transition: {
                y: { duration: 0.52, ease: [0.32, 0.72, 0, 1] },
                opacity: { duration: 0.45, ease: "easeIn" },
              },
            }}
          >
            {/* 1. Satin Ribbon Hanging from Top */}
            <div className="lanyard-ribbon">
              <div className="lanyard-ribbon-shine" />
            </div>

            {/* 2. Chrome Metallic Clasp Hook */}
            <div className="lanyard-clip">
              <div className="clip-buckle" />
              <div className="clip-swivel" />
              <div className="clip-hook" />
            </div>

            {/* 3. True 3D Perspective Stage directly centered on the card */}
            <div className="id-card-3d-stage">
              <motion.div
                className="id-card-3d-flipper"
                style={{ rotateY }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* 3D FRONT FACE (Holder + Punch Hole + macOS Close Button + Clips + Front Card) */}
                <motion.div
                  className="badge-3d-face badge-3d-face-front"
                  style={{ opacity: frontOpacity, visibility: frontVisibility }}
                >
                  <div className="id-card-acrylic">
                    {/* Top Punch Slot */}
                    <div className="badge-punch-hole" />

                    {/* Side Retention Clips */}
                    <div className="holder-clip-left" aria-hidden="true" />
                    <div className="holder-clip-right" aria-hidden="true" />

                    {/* Apple macOS Traffic-Light Close Button */}
                    <button
                      type="button"
                      className="badge-close-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTickSound();
                        onClose();
                      }}
                      aria-label="Close ID Badge"
                      title="Close (Esc)"
                    >
                      <svg
                        viewBox="0 0 10 10"
                        className="badge-close-cross-icon"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      >
                        <line x1="2.6" y1="2.6" x2="7.4" y2="7.4" />
                        <line x1="7.4" y1="2.6" x2="2.6" y2="7.4" />
                      </svg>
                    </button>

                    {/* The Inner Printed Editorial Card (Front Face) */}
                    <div className="id-card-inner">
                      {/* Diagonal Mint Green Background Vector Polygon */}
                      <svg
                        className="badge-card-bg-svg"
                        viewBox="0 0 292 440"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <polygon points="88,0 292,0 292,440 136,440" fill="#70e0a3" />
                      </svg>

                      {/* Top-Left Equalizer Stripes Pattern */}
                      <div className="badge-stripes-top" aria-hidden="true">
                        {[38, 56, 74, 42, 88, 62, 78, 48, 68, 36, 52].map((h, i) => (
                          <span
                            key={i}
                            className="stripe-bar stripe-bar-mint"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>

                      {/* Bottom-Right Equalizer Stripes Pattern */}
                      <div className="badge-stripes-bottom" aria-hidden="true">
                        {[28, 46, 68, 52, 86, 70, 102, 82, 114, 92, 74, 58].map((h, i) => (
                          <span
                            key={i}
                            className="stripe-bar stripe-bar-cyan"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>

                      {/* Portrait Photo Frame with Centered Role Pill Below */}
                      <div className="badge-photo-wrapper">
                        <div
                          className={`badge-photo-frame ${isPhotoColor ? "is-color" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPhotoColor((prev) => !prev);
                            playTickSound();
                          }}
                          title="Click or hover to reveal color"
                        >
                          <img
                            src="/ayush.png"
                            alt="Ayush Rai Portrait"
                            className="badge-photo-img"
                          />
                        </div>
                        <div className="badge-role-pill-center">
                          <span className="badge-role-pill">Full Stack Developer</span>
                        </div>
                      </div>

                      {/* Card Content Footer: Name & Title (Left) + Socials (Right) */}
                      <div className="badge-card-footer">
                        {/* Left: Bold Typography + Clean Live Precision Age */}
                        <div className="badge-name-block">
                          <div className="badge-age-clean-wrap" title="Live Precision Age (Born Mar 16, 2005)">
                            <div className="badge-age-clean-header">
                              <span className="badge-age-clean-label">AGE</span>
                              <span className="badge-age-clean-dash" />
                            </div>
                            <div className="badge-age-clean-counter">
                              <span className="badge-age-clean-num">22.</span>
                              <span className="badge-age-clean-ms">{ageDecimal}</span>
                              <span className="badge-age-clean-unit">YRS</span>
                            </div>
                          </div>

                          <h2 className="badge-name-first">AYUSH</h2>
                          <h2 className="badge-name-last">RAI</h2>
                        </div>

                        {/* Right: Connect & Social Badges */}
                        <div className="badge-connect-block">
                          <span className="badge-connect-label">CONNECT WITH ME</span>
                          <div className="badge-social-row">
                            {/* Email Pill */}
                            <a
                              href="#contact"
                              className="badge-social-pill"
                              title="Email / Contact"
                              onClick={() => onClose()}
                            >
                              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                            </a>
                            {/* GitHub Pill */}
                            <a
                              href="https://github.com/Ayush0150"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="badge-social-pill"
                              title="GitHub @Ayush0150"
                            >
                              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 3D BACK FACE (Matching Holder + Chip + Magstripe + Iyoush Gold Pass) */}
                <motion.div
                  className="badge-3d-face badge-3d-face-back"
                  style={{ opacity: backOpacity, visibility: backVisibility }}
                  aria-hidden="true"
                >
                  <div className="id-card-acrylic">
                    {/* Matching Top Punch Slot */}
                    <div className="badge-punch-hole" />

                    {/* Matching Side Retention Clips */}
                    <div className="holder-clip-left" />
                    <div className="holder-clip-right" />

                    {/* Back Face Pass Content */}
                    <div className="id-card-inner badge-face-back">
                      {/* Top Chip Row */}
                      <div className="badge-back-chip-row">
                        <div className="badge-back-chip" />
                      </div>

                      {/* Unified Portfolio Quote */}
                      <div className="badge-back-quote-container">
                        <p className="badge-quote-statement">
                          The nature of a portfolio<br />
                          is that it’s always a<br />
                          work in progress.
                        </p>
                      </div>

                      {/* Bottom Barcode & Author Attribution */}
                      <div className="badge-back-barcode-block">
                        <span className="badge-back-author">iyoush • portfolio</span>
                        <div className="badge-back-barcode-lines" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
