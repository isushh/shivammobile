"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
  text?: string;
  textSize?: string;
  padding?: string;
}

export default function BackButton({
  className = "",
  onClick,
  text = "Back",
  textSize = "text-xl",
  padding = "px-16 py-5"
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      onClick={handleBack}
      style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
      className={`group relative flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 font-medium text-white shadow-[0_4px_20px_0_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:border-white/80 hover:bg-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.4),inset_0_0_15px_rgba(255,255,255,0.2)] ${padding} ${textSize} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Subtle top reflection */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60" />

      {/* Hover background glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <span className="tracking-wider">{text}</span>
    </motion.button>
  );
}
