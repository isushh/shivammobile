"use client";

import { useState, useRef, useEffect } from "react";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const phone = "919507385664";
  const fallbackMessage = "Hi! I found your website and I would like to know more.";

  const buildUrl = () => {
    const text = message.trim() || fallbackMessage;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  return (
    <div className="cow-widget">
      {/* Chat Card */}
      <div className={`cow-chat-card ${isOpen ? "open" : ""}`}>
        <div className="cow-chat-card-inner">
          <div className="cow-chat-card-header">
            <div className="cow-chat-avatar">SC</div>
            <div className="cow-chat-meta">
              <strong>Shivam Mobile Care</strong>
              <span>Usually replies within minutes</span>
            </div>
            <button
              className="cow-chat-close"
              type="button"
              aria-label="Close WhatsApp chat"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="cow-chat-message">
            Hi there! 👋 How can we help you today? Ask us about phones, EMI plans, repairs, or anything else!
          </div>
          <input
            ref={inputRef}
            className="cow-chat-input"
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                window.open(buildUrl(), "_blank");
              }
            }}
          />
          <a
            className="cow-chat-cta"
            href={buildUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>➜</span> Start Chat
          </a>
        </div>
      </div>

      {/* Floating Button */}
      <button
        className="cow-floating-button"
        type="button"
        aria-label="Chat on WhatsApp"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="cow-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">
            <path
              fill="#FFFFFF"
              d="M27.2 4.8A15.86 15.86 0 0 0 16 0C7.164 0 0 7.163 0 16c0 2.82.738 5.575 2.139 8.005L0 32l8.205-2.11A15.93 15.93 0 0 0 16 32c8.836 0 16-7.163 16-16 0-4.274-1.664-8.29-4.8-11.2ZM16 29.091a13 13 0 0 1-6.637-1.821l-.473-.28-4.868 1.25 1.298-4.746-.308-.486A13.012 13.012 0 0 1 2.909 16C2.909 8.77 8.77 2.91 16 2.91S29.091 8.77 29.091 16 23.23 29.091 16 29.091Zm7.182-9.76c-.393-.197-2.327-1.148-2.688-1.279-.36-.131-.623-.197-.885.197-.262.393-1.016 1.279-1.246 1.54-.23.262-.459.295-.852.098-.393-.197-1.66-.612-3.162-1.95-1.168-1.04-1.956-2.325-2.185-2.719-.23-.393-.025-.606.172-.803.177-.176.393-.459.59-.688.197-.23.262-.394.394-.656.131-.262.065-.492-.033-.688-.098-.197-.885-2.131-1.213-2.917-.318-.764-.64-.66-.885-.672l-.754-.013c-.262 0-.688.098-1.049.492s-1.377 1.345-1.377 3.278c0 1.934 1.41 3.802 1.607 4.064.197.262 2.777 4.241 6.728 5.945.94.406 1.674.648 2.246.829.944.3 1.804.258 2.484.156.758-.113 2.327-.95 2.655-1.868.328-.918.328-1.705.23-1.868-.098-.164-.36-.263-.754-.459Z"
            />
          </svg>
        </span>
        <span className="cow-label">Chat on WhatsApp</span>
      </button>
    </div>
  );
}
