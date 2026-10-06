import { motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";

export default function FigmaCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    // Only activate on pointer devices (desktop / trackpad / mouse)
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const handlePointerMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsVisible(true);
    };

    const handlePointerLeave = () => setIsVisible(false);
    const handlePointerEnter = () => setIsVisible(true);
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    document.documentElement.addEventListener("pointerenter", handlePointerEnter);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      document.documentElement.removeEventListener("pointerenter", handlePointerEnter);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="figma-cursor-container"
      style={{
        x: mouseX,
        y: mouseY,
      }}
      animate={{
        scale: isPressed ? 0.9 : 1,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      {/* Figma Arrow Pointer */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        className="figma-cursor-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 1.5 1.5 L 1.5 16.5 L 5.5 12.8 L 8.6 19.5 L 11 18.3 L 7.8 11.8 L 13.5 11.8 Z"
          fill="#a259ff"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {/* "You" Multiplayer Name Tag */}
      <div className="figma-cursor-badge">
        <span>You</span>
      </div>
    </motion.div>
  );
}
