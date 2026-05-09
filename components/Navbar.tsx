"use client";

import { useState } from "react";
import type { Profile } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  profile: Profile | null;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { id: "catalog", label: "Catalog", desc: "Explore our collection of premium phones and accessories.", icon: "📱" },
  { id: "about", label: "About Us", desc: "Learn about our 7-year journey serving Sitamarhi.", icon: "🏛️" },
  { id: "contact", label: "Contact", desc: "Get in touch for support, repairs, or inquiries.", icon: "📧" },
  { id: "support", label: "Help & Support", desc: "Warranty, repair status, and common questions.", icon: "🛠️" },
];

export default function Navbar({ activePage, onNavigate, profile, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const adminPages: { id: string; label: string }[] = [];
  if (profile && profile.role === "staff" && profile.is_approved) {
    adminPages.push({ id: "staff", label: "Dashboard" });
  }
  if (profile && profile.role === "owner") {
    adminPages.push({ id: "owner", label: "Dashboard" });
  }

  const handleNav = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className="transparent-nav">
        <div className="logo" onClick={() => handleNav("home")}>
          SHIVAM <em>MOBILE CARE</em>
        </div>

        <div className="nav-right">
          <div className="nav-actions">
            <button 
              className={`menu-trigger ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              Menu <span className="menu-dot" />
            </button>

            {adminPages.map((p) => (
              <button key={p.id} className="btn-ghost-small" onClick={() => handleNav(p.id)}>
                {p.label}
              </button>
            ))}

            {profile ? (
              <div className="user-nav">
                <span className="user-name">{profile.full_name}</span>
                <button className="btn-logout" onClick={onLogout}>Logout</button>
              </div>
            ) : (
              <button
                className="btn-primary-small"
                onClick={() => (window.location.href = "/login")}
              >
                Login
              </button>
            )}
          </div>

          <button
            className="mobile-menu-btn desktop-hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              key="mega-menu-dropdown"
              className="mega-menu"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mega-menu-content">
                <div className="mega-menu-grid">
                  <div className="mega-menu-list">
                    {MENU_ITEMS.map((item) => (
                      <div 
                        key={item.id} 
                        className={`mega-menu-item ${activePage === item.id ? "active" : ""}`}
                        onClick={() => handleNav(item.id)}
                      >
                        <div className="item-icon">{item.icon}</div>
                        <div className="item-text">
                          <div className="item-label">{item.label}</div>
                          <div className="item-desc">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mega-menu-featured">
                    <div className="featured-card">
                      <div className="featured-tag">Latest Arrival</div>
                      <h3>iPhone 15 Pro</h3>
                      <p>Experience the power of titanium. Now available at 0% EMI.</p>
                      <button onClick={() => handleNav("catalog")}>View Details</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${mobileOpen ? "open" : ""}`}>
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className="nav-link w-full text-left bg-transparent border-none"
                  style={{ display: "block" }}
                >
                  {item.label}
                </button>
              ))}
        {adminPages.map((p) => (
          <button key={p.id} className="nav-link w-full text-left bg-transparent border-none" style={{ display: "block" }} onClick={() => handleNav(p.id)}>{p.label}</button>
        ))}
        {profile ? (
          <button className="nav-link w-full text-left bg-transparent border-none" style={{ display: "block", color: "#f87171" }} onClick={onLogout}>Logout</button>
        ) : (
          <button 
            className="nav-link w-full text-left bg-transparent border-none" 
            style={{ display: "block" }} 
            onClick={() => (window.location.href = "/login")}
          >
            Login
          </button>
        )}
      </div>

      {/* Overlay to close menu on click outside */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}