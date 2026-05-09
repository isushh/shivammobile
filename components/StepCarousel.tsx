"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  num: string;
  title: string;
  description: string;
  icon: string;
}

interface StepCarouselProps {
  steps: Step[];
}

/* ---------- Arrow Button ---------- */
function ArrowButton({
  direction = "left",
  size = 44,
  onClick,
}: {
  direction?: "left" | "right";
  size?: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, backgroundColor: "rgba(99, 102, 241, 0.2)" }}
      whileTap={{ scale: 0.9 }}
      className="carousel-arrow"
      style={{
        width: size,
        height: size,
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(10px)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <ArrowIcon direction={direction} />
    </motion.button>
  );
}

function ArrowIcon({ direction = "left", size = 20 }: { direction?: "left" | "right"; size?: number }) {
  const color = "currentColor";
  const strokeWidth = 2;
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {direction === "left" ? (
        <>
          <polyline {...common} points="15 18 9 12 15 6" />
          <line {...common} x1="21" y1="12" x2="9" y2="12" />
        </>
      ) : (
        <>
          <polyline {...common} points="9 6 15 12 9 18" />
          <line {...common} x1="3" y1="12" x2="15" y2="12" />
        </>
      )}
    </svg>
  );
}

export default function StepCarousel({ steps }: StepCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const len = steps.length || 1;

  const next = useCallback(() => setIndex((i) => (i + 1) % len), [len]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + len) % len), [len]);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) next();
    }, 4500);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const roleOf = (i: number) => {
    if (i === index) return "active";
    if (i === (index - 1 + len) % len) return "prev";
    if (i === (index + 1) % len) return "next";
    return "hidden";
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 30,
  };

  return (
    <div 
      className="carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-stage">
        {steps.map((step, i) => {
          const role = roleOf(i);
          if (role === "hidden") return null;

          const layout =
            role === "active"
              ? { scale: 1, opacity: 1, y: 0, z: 3 }
              : role === "prev"
              ? { scale: 0.92, opacity: 0.5, y: -45, z: 2 }
              : { scale: 0.92, opacity: 0.5, y: 45, z: 1 };

          return (
            <motion.div
              key={step.num}
              initial={false}
              animate={{
                scale: layout.scale,
                opacity: layout.opacity,
                y: layout.y,
                zIndex: layout.z,
              }}
              transition={springTransition}
              className={`step-card ${role}`}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "24px",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                pointerEvents: role === "active" ? "auto" : "none",
                willChange: "transform, opacity",
              }}
            >
              <span className="step-num">{step.num}</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-1px" }}>
                {step.title}
              </h2>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: "480px" }}>
                {step.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="carousel-controls" style={{ display: "flex", gap: "1rem", marginTop: "40px" }}>
        <ArrowButton direction="left" onClick={prev} />
        <ArrowButton direction="right" onClick={next} />
      </div>
    </div>
  );
}
