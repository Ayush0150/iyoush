import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { playTickSound } from "../utils/sound";

const MESSAGES = [
  "Hi! I’m Pixel, Ayush’s\ndesign buddy.",
  "His socials and resume are in the bar below.",
  "Press 'C' anytime to copy Ayush's email.",
];

export default function MascotBot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // References and Motion Values for Organic Eye Tracking
  const botRef = useRef(null);
  const rawPupilX = useMotionValue(-3.5);
  const rawPupilY = useMotionValue(0);

  // Ultra-smooth spring physics for organic, natural eye movement
  const smoothPupilX = useSpring(rawPupilX, { stiffness: 220, damping: 22, mass: 0.45 });
  const smoothPupilY = useSpring(rawPupilY, { stiffness: 220, damping: 22, mass: 0.45 });

  // Mouse cursor tracking
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!botRef.current) return;
      const rect = botRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width * 0.47;
      const eyeCenterY = rect.top + rect.height * 0.52;

      const dx = e.clientX - eyeCenterX;
      const dy = e.clientY - eyeCenterY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) return;

      const angle = Math.atan2(dy, dx);
      // Maximum displacement inside the eye white
      const maxDist = 4.8;
      const travel = Math.min(maxDist, (dist / 140) * maxDist);

      rawPupilX.set(Math.cos(angle) * travel);
      rawPupilY.set(Math.sin(angle) * travel);
    };

    const handlePointerLeave = () => {
      // Smoothly return to resting pose (looking slightly towards user/bubble)
      rawPupilX.set(-3.5);
      rawPupilY.set(0);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [rawPupilX, rawPupilY]);

  const blinkTimeoutRef = useRef(null);

  const triggerBlink = (duration = 200) => {
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    setIsBlinking(true);
    blinkTimeoutRef.current = setTimeout(() => {
      setIsBlinking(false);
    }, duration);
  };

  // Natural periodic blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      triggerBlink(160);
    }, 4200);
    return () => {
      clearInterval(blinkInterval);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  const handleMascotClick = () => {
    playTickSound();
    setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    triggerBlink(220);
  };

  return (
    <div className="mascot-bot-container">
      {/* Speech Bubble (Identical to figmaebae reference) */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key={messageIndex}
            className="mascot-speech-bubble"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 440, damping: 28 }}
            onClick={handleMascotClick}
          >
            <p className="mascot-speech-text">{MESSAGES[messageIndex]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Robot Character (Pixel - Exact Vector Recreation from Screenshot) */}
      <motion.button
        ref={botRef}
        type="button"
        className="mascot-bot-trigger"
        onClick={handleMascotClick}
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Pixel, Ayush's design buddy"
      >
        <svg
          viewBox="0 0 240 210"
          width="134"
          height="117"
          className="mascot-bot-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="mascot-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* Ground Soft Shadow */}
          <ellipse
            cx="111.5"
            cy="189"
            rx="38"
            ry="6.5"
            fill="rgba(0, 0, 0, 0.1)"
            filter="url(#mascot-shadow-blur)"
          />

          {/* Left Foot */}
          <rect x="85" y="172" width="20" height="11" rx="5.5" fill="#893ff0" />

          {/* Right Foot */}
          <rect x="118" y="172" width="20" height="11" rx="5.5" fill="#893ff0" />

          {/* Left Curved Arm */}
          <path
            d="M 64 131 C 53 133, 44 142, 46 153 C 47 158, 53 158, 55 151 C 57 145, 61 138, 66 136 Z"
            fill="#893ff0"
          />

          {/* Right Curved Arm */}
          <path
            d="M 159 131 C 170 133, 179 142, 177 153 C 176 158, 170 158, 168 151 C 166 145, 162 138, 157 136 Z"
            fill="#893ff0"
          />

          {/* Main Body Dome */}
          <path
            d="M 61 118 C 61 80, 83 66, 111.5 66 C 140 66, 162 80, 162 118 C 162 156, 142 174, 111.5 174 C 81 174, 61 156, 61 118 Z"
            fill="#a259ff"
          />

          {/* Head Highlight Pill / Crescent */}
          <path
            d="M 76 93 C 80 84, 88 77, 100 73"
            stroke="rgba(255, 255, 255, 0.38)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Antenna Stem */}
          <line
            x1="111.5"
            y1="56"
            x2="111.5"
            y2="67"
            stroke="#893ff0"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Antenna Golden Yellow Bulb */}
          <circle cx="111.5" cy="51.2" r="7.5" fill="#fac302" />

          {/* Eyes with Smooth Cursor Tracking */}
          {isBlinking ? (
            <>
              {/* Blinking Left Eye Arc */}
              <path
                d="M 83 113 Q 95 118 107 113"
                stroke="#18181b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Blinking Right Eye Arc */}
              <path
                d="M 119 113 Q 131 118 143 113"
                stroke="#18181b"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <>
              {/* Left Eye White */}
              <ellipse cx="95.1" cy="112.4" rx="12.5" ry="14" fill="#ffffff" />
              {/* Left Pupil & Highlight (Smooth tracking) */}
              <motion.g style={{ x: smoothPupilX, y: smoothPupilY }}>
                <circle cx="95.1" cy="112.4" r="6.2" fill="#18181b" />
                <circle cx="93.1" cy="109.9" r="2.2" fill="#ffffff" />
              </motion.g>

              {/* Right Eye White */}
              <ellipse cx="131.0" cy="112.3" rx="12.5" ry="14" fill="#ffffff" />
              {/* Right Pupil & Highlight (Smooth tracking) */}
              <motion.g style={{ x: smoothPupilX, y: smoothPupilY }}>
                <circle cx="131.0" cy="112.3" r="6.2" fill="#18181b" />
                <circle cx="129.0" cy="109.8" r="2.2" fill="#ffffff" />
              </motion.g>
            </>
          )}

          {/* Cheeks (Blush) */}
          <rect x="71" y="132" width="15" height="8" rx="4" fill="#f187ca" />
          <rect x="137" y="132" width="15" height="8" rx="4" fill="#f187ca" />

          {/* Cute Smiling Mouth */}
          <path
            d="M 101 138 Q 111.5 145 122 138"
            stroke="#18181b"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.button>
    </div>
  );
}


