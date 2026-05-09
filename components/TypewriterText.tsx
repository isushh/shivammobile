"use client";

import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

interface TypewriterTextProps {
  texts: string[];
  delay?: number;
  speed?: number;
  className?: string;
  as?: "h1" | "h2" | "p";
}

export default function TypewriterText({
  texts = [],
  delay = 0,
  speed = 0.04,
  className = "",
  as: Component = "h1",
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(speed * 1000);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (texts.length === 0) return;

    const handleType = () => {
      const i = loopNum % texts.length;
      const fullText = texts[i];

      setDisplayedText(
        isDeleting
          ? fullText.substring(0, displayedText.length - 1)
          : fullText.substring(0, displayedText.length + 1)
      );

      let delta = isDeleting ? speed * 500 : speed * 1000;

      // Smart pauses on punctuation (only when typing forward)
      if (!isDeleting) {
        const lastChar = fullText[displayedText.length];
        if (lastChar === "." || lastChar === "?" || lastChar === "!") delta = 800;
        else if (lastChar === "," || lastChar === ";" || lastChar === ":") delta = 450;
      }

      if (!isDeleting && displayedText === fullText) {
        delta = 2500; // Pause at the end of the phrase
        setIsDeleting(true);
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        delta = 500;
      }

      setTypingSpeed(delta);
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, texts, speed, typingSpeed]);

  return (
    <Component className={`primary-typography typewriter-container ${className}`}>
      <span className={`typewriter-text ${!isDeleting ? "typing-active" : "typing-paused"}`}>
        {mounted ? displayedText : ""}
      </span>
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8 }}
        className="typewriter-caret block-caret"
      />
    </Component>
  );
}
