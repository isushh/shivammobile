"use client";

import { motion } from "framer-motion";

interface HeroSectionProps {
    children?: React.ReactNode;
}

export default function HeroSection({ children }: HeroSectionProps) {
    return (
        <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
            {/* Teal Gradient Border at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-light to-transparent" />

            {/* Animated Content Container */}
            <motion.div
                className="w-full max-w-5xl mx-auto text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.8,
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: 0.2,
                }}
            >
                {children}
            </motion.div>

            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
            </div>
        </section>
    );
}