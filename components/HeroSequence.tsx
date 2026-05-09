"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const TOTAL_FRAMES = 192;

interface HeroSequenceProps {
  children?: React.ReactNode;
}

export default function HeroSequence({ children }: HeroSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track the scroll of the entire page
  const { scrollYProgress } = useScroll();

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = i.toString().padStart(3, '0');
      img.src = `/hgif/frame_${paddedIndex}_delay-0.042s.jpg`;
      
      img.onload = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };
      // For images that fail to load, count them anyway so we don't get stuck
      img.onerror = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          setIsLoaded(true);
        }
      };
      images.push(img);
    }
    
    setLoadedImages(images);
  }, []);

  useEffect(() => {
    if (!isLoaded || !canvasRef.current || loadedImages.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(frameIndex.get());
    };

    const renderFrame = (index: number) => {
      const img = loadedImages[Math.round(index)];
      if (!img || !ctx) return;

      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;

      ctx.fillStyle = '#08080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const unsubscribe = frameIndex.on("change", (latest) => {
      requestAnimationFrame(() => renderFrame(latest));
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      unsubscribe();
    };
  }, [isLoaded, loadedImages, frameIndex]);

  return (
    <>
      {!isLoaded && (
        <div className="loading-screen">
          <div className="loader">
            <div className="loader-text">Loading Experience... {progress}%</div>
            <div className="loader-bar-bg">
              <motion.div 
                className="loader-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Background Canvas */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="canvas-overlay"></div>
      </div>

      {/* Page Content overlays the canvas */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  );
}
