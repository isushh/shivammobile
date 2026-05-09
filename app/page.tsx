"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HomePage from "@/components/HomePage";
import CatalogPage from "@/components/CatalogPage";
import StaffDashboard from "@/components/StaffDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import Toast from "@/components/Toast";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import { supabase, getProfile, type Profile, type UserRole } from "@/lib/supabase";

export default function Page() {
  const [activePage, setActivePage] = useState("home");
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (session: any) => {
      let targetPage = null;
      try {
        const params = new URLSearchParams(window.location.search);
        targetPage = params.get("page");
      } catch (e) {
        // ignore window errors
      }

      if (session) {
        const p = await getProfile();
        if (!isMounted) return;
        setProfile(p);
        if (p?.role === "owner") {
          setActivePage(targetPage === "catalog" || targetPage === "home" ? targetPage : "owner");
        } else if (p?.role === "staff") {
          setActivePage(targetPage === "catalog" || targetPage === "home" ? targetPage : "staff");
        } else {
          setActivePage(targetPage || "home");
        }
      } else {
        if (!isMounted) return;
        setProfile(null);
        if (targetPage && targetPage !== "owner" && targetPage !== "staff") {
          setActivePage(targetPage);
        } else {
          setActivePage("home");
        }
      }
    };

    const initProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSession(session);
      } catch (err) {
        console.error("Init profile error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      handleSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = (page: string) => {
    // Handle scrolling for home sections
    if (page === "contact" || page === "about") {
      if (activePage !== "home") {
        setActivePage("home");
        // Wait for state change then scroll
        setTimeout(() => {
          const footer = document.querySelector('footer');
          footer?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const footer = document.querySelector('footer');
        footer?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Guard protected pages
    if (page === "staff" && (!profile || (profile.role !== "staff" && profile.role !== "owner"))) {
      window.location.href = "/login";
      return;
    }
    if (page === "staff" && profile?.role === "staff" && !profile.is_approved) {
      showToast("Your account is pending owner approval.");
      return;
    }
    if (page === "owner" && (!profile || profile.role !== "owner")) {
      window.location.href = "/login";
      return;
    }
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setActivePage("home");
    showToast("Logged out successfully");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="logo" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
            SHIVAM <em>MOBILE CARE</em>
          </div>
          <p style={{ color: "var(--subtext)", fontSize: ".85rem" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        activePage={activePage}
        onNavigate={navigate}
        profile={profile}
        onLogout={handleLogout}
      />

      <div className={`page ${activePage === "home" ? "active" : ""}`}>
        <HomePage onNavigate={navigate} />
      </div>

      <div className={`page ${activePage === "catalog" ? "active" : ""}`}>
        <CatalogPage showToast={showToast} />
      </div>

      {/* Protected: Staff Dashboard */}
      {profile && (profile.role === "staff" || profile.role === "owner") && profile.is_approved && (
        <div className={`page ${activePage === "staff" ? "active" : ""}`}>
          <StaffDashboard showToast={showToast} userId={profile.id} />
        </div>
      )}

      {/* Protected: Owner Dashboard */}
      {profile && profile.role === "owner" && (
        <div className={`page ${activePage === "owner" ? "active" : ""}`}>
          <OwnerDashboard showToast={showToast} />
        </div>
      )}

      <Toast message={toast} />
      <WhatsAppWidget />
    </>
  );
}
