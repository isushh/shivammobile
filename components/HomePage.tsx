"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import HeroSequence from "@/components/HeroSequence";
import StepCarousel from "@/components/StepCarousel";
import TypewriterText from "@/components/TypewriterText";
import AnimatedNumber from "@/components/AnimatedNumber";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, delay = 0, className = "", direction = -40 }: { children: React.ReactNode; delay?: number; className?: string; direction?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: direction }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const BRANDS = ["Apple", "Samsung", "Vivo", "Sony", "Xiaomi", "Realme", "Oppo", "LG"];
const MARQUEE = [...BRANDS, ...BRANDS]; // duplicate for infinite scroll


export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <HeroSequence>
      {/* ── HERO ── */}
        <div className="hero">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="hero-badge-dot" />
            ⚡ Est. 2017 · Runnisaidpur, Sitamarhi
          </motion.div>

          <TypewriterText 
            as="h1"
            className="with-reflection"
            texts={[
              "The Smartest Mobile Shop.",
              "Most Trusted EMI Services.",
              "Most Convenient Mobile Experience.",
              "Premium Tech. Honest Service."
            ]}
            speed={0.06}
          />

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            Premium phones from Apple, Samsung, Vivo, Sony &amp; more — all at{" "}
            <strong style={{ color: "var(--teal-glow)" }}>0% EMI</strong>. Honest
            service since 2017.
          </motion.p>

          <motion.div
            className="hero-cta-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.button
              className="btn-primary"
              onClick={() => onNavigate("catalog")}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Catalog →
            </motion.button>
            <motion.button
              className="btn-ghost"
              onClick={() => onNavigate("catalog")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              View Offers
            </motion.button>
          </motion.div>

          <motion.div
            className="hero-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            ▼ SCROLL
          </motion.div>

          {/* Floating UI card — visible on wide screens */}
          <motion.div
            className="hero-ui-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-ui-card-title">Top Picks Today</div>
            {[
              { icon: "📱", name: "iPhone 15", price: "₹79,999", badge: "0% EMI" },
              { icon: "🤖", name: "Galaxy S24", price: "₹74,999", badge: "0% EMI" },
              { icon: "🎯", name: "Vivo V30 Pro", price: "₹39,999", badge: "Hot" },
            ].map((p) => (
              <div className="hero-ui-phone-row" key={p.name}>
                <div className="hero-ui-icon">{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="hero-ui-phone-name">{p.name}</div>
                  <div className="hero-ui-phone-price">{p.price}</div>
                </div>
                <span className="hero-ui-badge">{p.badge}</span>
              </div>
            ))}
          </motion.div>
        </div>
      {/* ── BRAND MARQUEE ── */}
      <div className="marquee-section">
        <div className="marquee-track">
          {MARQUEE.map((brand, i) => (
            <div className="marquee-item" key={i}>
              {brand}
              <span className="marquee-dot" />
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS + BENTO ── */}
      <div className="section">
        <FadeIn>
          <div className="section-label">Why Choose Us</div>
          <div className="section-header">
            <h2>
              Bihar&apos;s Most Trusted{" "}
              <span className="gradient-text">Mobile Store</span>
            </h2>
            <p>Authorised retailer for all major brands. 0% EMI, honest prices, no hidden charges.</p>
          </div>
        </FadeIn>

        <div className="bento">
          {/* Large: 0% EMI */}
          <FadeIn delay={0.05}>
            <div className="bento-card large" style={{ minHeight: 280 }}>
              <div className="big-zero">
                <AnimatedNumber value={0} suffix="%" />
              </div>
              <h3>EMI on All Brands</h3>
              <p style={{ color: "var(--subtext)", fontSize: ".85rem", margin: ".5rem 0 1.6rem", lineHeight: 1.75 }}>
                No interest. No hidden fees. Walk in, pick your phone, and pay in easy monthly instalments.
              </p>
              <motion.button
                className="btn-primary"
                onClick={() => onNavigate("catalog")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ fontSize: ".8rem", padding: ".7rem 1.6rem" }}
              >
                Shop Now →
              </motion.button>
            </div>
          </FadeIn>

          {/* Trust */}
          <FadeIn delay={0.1}>
            <div className="bento-card" style={{ minHeight: 280 }}>
              <div className="since">
                <AnimatedNumber value={2017} />
              </div>
              <p style={{ color: "var(--subtext)", fontSize: ".8rem", margin: ".2rem 0 .7rem" }}>
                Serving Sitamarhi Since
              </p>
              <div className="verified">✅ Verified &amp; Trusted</div>
              <p style={{ fontSize: ".78rem", color: "var(--subtext)", marginTop: "1.1rem", lineHeight: 1.75 }}>
                7+ years. Thousands of happy customers across Sitamarhi &amp; Runnisaidpur.
              </p>
            </div>
          </FadeIn>

          {/* Brands */}
          <FadeIn delay={0.12}>
            <div className="bento-card wide">
              <p style={{ fontSize: ".62rem", fontWeight: 700, letterSpacing: "2.5px", color: "var(--subtext)", textTransform: "uppercase" as const, marginBottom: ".7rem" }}>
                Authorized Retailer For
              </p>
              <div className="brand-logos">
                {BRANDS.map((brand, i) => (
                  <motion.div
                    className="brand-logo"
                    key={brand}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 0.45, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ opacity: 1, scale: 1.06 }}
                  >
                    {brand.toUpperCase()}
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Stats */}
          {[
            { value: 5000, suffix: "+", label: "Happy Customers" },
            { value: 24, suffix: "h", label: "Quick Delivery" },
            { value: 100, suffix: "%", label: "Authentic Products" },
          ].map((stat, i) => (
            <FadeIn delay={0.15 + i * 0.05} key={stat.label}>
              <div className="bento-card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
                <div className="stat-big">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="stat-sub">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ── GLOWING DIVIDER ── */}
      <div className="glow-divider" />

      {/* ── HOW IT WORKS ── */}
      <div className="section">
        <FadeIn>
          <div className="section-label">Our Process</div>
          <div className="section-header">
            <h2>
              Get Your Phone in{" "}
              <span className="gradient-text">3 Simple Steps</span>
            </h2>
            <p>From browsing to delivery — the easiest phone buying experience in Sitamarhi.</p>
          </div>
        </FadeIn>

        <StepCarousel 
          steps={[
            {
              num: "Step 01",
              icon: "🔍",
              title: "Browse & Choose",
              description: "Explore our catalog of 100+ phones from Apple, Samsung, Vivo, Sony, Xiaomi and more. Filter by brand or price.",
            },
            {
              num: "Step 02",
              icon: "📋",
              title: "Pick Your EMI Plan",
              description: "Choose 0% EMI across 3–24 months. No interest, no hidden charges. We handle all the paperwork for you.",
            },
            {
              num: "Step 03",
              icon: "🚀",
              title: "Get It Delivered",
              description: "Pick up in-store or get fast delivery to your doorstep within Sitamarhi & Runnisaidpur in 24 hours.",
            },
          ]} 
        />
      </div>

      {/* ── SCROLL SPACER ── */}
      {/* This invisible spacer adds height to the page so the background animation scrubs more slowly and smoothly over a longer scroll distance. */}
      <div style={{ height: '80vh', width: '100%', pointerEvents: 'none' }} />

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-brand">
          SHIVAM <em>MOBILE CARE</em>
        </div>
        <div className="footer-loc">
          📍 Opposite Bus Stand, Runnisaidpur, Sitamarhi, Bihar — 843329
          <br />
          📞 +91 98765 43210 | 📧 contact@shivammobile.com
        </div>
        <div className="footer-bottom">
          © 2024 Shivam Mobile Care. Designed for Excellence.
        </div>
      </footer>
    </HeroSequence>
  );
}
