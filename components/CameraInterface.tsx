"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraInterfaceProps {
    onCapture: (imageBlob: Blob, type: "in" | "out") => void;
    isProcessing: boolean;
}

export default function CameraInterface({ onCapture, isProcessing }: CameraInterfaceProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [scanLinePosition, setScanLinePosition] = useState(0);
    const [scanDirection, setScanDirection] = useState(1);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError("Unable to access camera. Please grant camera permissions.");
            console.error("Camera error:", err);
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Capture image
    const captureImage = useCallback((type: "in" | "out") => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const imageUrl = URL.createObjectURL(blob);
                        setCapturedImage(imageUrl);
                        onCapture(blob, type);
                    }
                }, "image/jpeg", 0.8);
            }
        }
    }, [onCapture]);

    // Scan line animation
    useEffect(() => {
        const animate = () => {
            setScanLinePosition(prev => {
                const newPos = prev + (0.5 * scanDirection);
                if (newPos >= 100 || newPos <= 0) {
                    setScanDirection(prev => -prev);
                    return prev >= 100 ? 100 : 0;
                }
                return newPos;
            });
        };
        const interval = setInterval(animate, 16);
        return () => clearInterval(interval);
    }, [scanDirection]);

    // Initialize camera on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, [startCamera, stopCamera]);

    // Reset after successful capture
    useEffect(() => {
        if (!isProcessing && capturedImage) {
            const timer = setTimeout(() => {
                setCapturedImage(null);
                startCamera();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isProcessing, capturedImage, startCamera]);

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Camera Preview Container */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-primary shadow-2xl shadow-primary/30">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />

                {/* Canvas for capture (hidden) */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Scan Line Animation Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_#0D9488]"
                        style={{ top: `${scanLinePosition}%` }}
                    />
                    <div
                        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-primary/10 to-transparent"
                        style={{ top: `${scanLinePosition}%`, transform: `translateY(-100%)` }}
                    />
                </div>

                {/* Corner Brackets */}
                <div className="absolute inset-4 border-2 border-primary/30 rounded-full pointer-events-none" />

                {/* Captured Image Overlay */}
                <AnimatePresence>
                    {capturedImage && (
                        <motion.div
                            className="absolute inset-0 bg-black/60 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="text-center"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                            >
                                {/* Success Checkmark */}
                                <motion.div
                                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <svg
                                        className="w-10 h-10 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </motion.div>
                                <p className="text-white font-semibold text-lg">
                                    Check-in Successful!
                                </p>
                                <p className="text-white/70 text-sm mt-1">
                                    Have a great shift!
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                        <div className="text-center">
                            <svg
                                className="w-12 h-12 mx-auto mb-3 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <p className="text-white text-sm">{error}</p>
                            <button
                                onClick={startCamera}
                                className="mt-4 px-4 py-2 bg-primary text-white rounded-full text-sm"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6 mt-8">
                {/* Punch In Button */}
                <motion.button
                    className="relative overflow-hidden px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg shadow-lg shadow-primary/40"
                    onClick={() => captureImage("in")}
                    disabled={isProcessing || !!capturedImage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="relative z-10">Punch In</span>
                    <LiquidFill />
                </motion.button>

                {/* Punch Out Button */}
                <motion.button
                    className="relative overflow-hidden px-8 py-4 rounded-full border-2 border-primary text-primary font-semibold text-lg hover:bg-primary/10"
                    onClick={() => captureImage("out")}
                    disabled={isProcessing || !!capturedImage}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="relative z-10">Punch Out</span>
                </motion.button>
            </div>
        </div>
    );
}

// Liquid Fill Animation Component
function LiquidFill() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-primary-light/30 to-transparent"
                initial={{ y: "100%" }}
                animate={{ y: "-20%" }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}