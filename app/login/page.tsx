"use client";

import { useState } from "react";
import { signUp, signIn, supabase, type UserRole } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        if (role === "owner" && email !== "iamsushant3073@gmail.com") {
          setError("Unauthorized email. Only the designated owner can create an owner account.");
          setLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password, fullName, role);
        if (signUpError) {
          setError((signUpError as any).message || "Sign up failed");
        } else {
          if (role === "staff") {
            setSuccess("Account created! Please wait for owner approval before logging in.");
          } else {
            setSuccess("Account created! You can now log in.");
          }
          setMode("login");
        }
      } else {
        const { data, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else if (data.user) {
          // Redirect based on role
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            // Fallback redirect if profile fetch fails
            window.location.href = "/";
          } else if (profile?.role === 'owner') {
            window.location.href = "/?page=owner";
          } else if (profile?.role === 'staff') {
            window.location.href = "/?page=staff";
          } else {
            window.location.href = "/";
          }
        } else {
          setError("Login failed: Could not retrieve user data.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const roles: { id: UserRole; label: string; icon: string; desc: string }[] = [
    { id: "customer", label: "Customer", icon: "🛍️", desc: "Browse & order phones" },
    { id: "staff", label: "Staff", icon: "👤", desc: "Attendance & tasks" },
    { id: "owner", label: "Owner", icon: "👑", desc: "Full dashboard access" },
  ];

  return (
    <div style={{ paddingTop: "62px", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "420px", width: "100%", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="logo" style={{ fontSize: "1.4rem", marginBottom: ".5rem" }}>
            SHIVAM <em>MOBILE CARE</em>
          </div>
          <p style={{ color: "var(--subtext)", fontSize: ".85rem" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Role Selection (signup only) */}
        {mode === "signup" && (
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem" }}>
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1,
                  padding: ".8rem .5rem",
                  background: role === r.id ? "var(--teal)" : "var(--card)",
                  color: role === r.id ? "#fff" : "var(--text)",
                  border: `1px solid ${role === r.id ? "var(--teal)" : "var(--border)"}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all .2s",
                  fontFamily: "'Montserrat', sans-serif",
                  textAlign: "center" as const,
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: ".75rem", letterSpacing: ".5px" }}>{r.label}</div>
                <div style={{ fontSize: ".62rem", color: role === r.id ? "rgba(255,255,255,.7)" : "var(--subtext)", marginTop: ".2rem" }}>{r.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Staff approval notice */}
        {mode === "signup" && role === "staff" && (
          <div style={{
            background: "rgba(245,158,11,.1)",
            border: "1px solid rgba(245,158,11,.3)",
            borderRadius: "4px",
            padding: ".6rem .8rem",
            marginBottom: "1rem",
            fontSize: ".75rem",
            color: "#f59e0b",
            fontWeight: 700,
          }}>
            ⚠️ Staff accounts require owner approval before access is granted.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: ".72rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--subtext)", marginBottom: ".4rem" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your name"
                style={{
                  width: "100%",
                  padding: ".7rem .9rem",
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "2px",
                  color: "var(--text)",
                  fontSize: ".85rem",
                  fontFamily: "'Montserrat', sans-serif",
                  outline: "none",
                  transition: "border-color .2s",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--subtext)", marginBottom: ".4rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: ".7rem .9rem",
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                borderRadius: "2px",
                color: "var(--text)",
                fontSize: ".85rem",
                fontFamily: "'Montserrat', sans-serif",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: ".72rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--subtext)", marginBottom: ".4rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              style={{
                width: "100%",
                padding: ".7rem .9rem",
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                borderRadius: "2px",
                color: "var(--text)",
                fontSize: ".85rem",
                fontFamily: "'Montserrat', sans-serif",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,.1)",
              border: "1px solid rgba(248,113,113,.3)",
              borderRadius: "4px",
              padding: ".6rem .8rem",
              marginBottom: "1rem",
              fontSize: ".78rem",
              color: "#f87171",
              fontWeight: 700,
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: "rgba(16,185,129,.1)",
              border: "1px solid rgba(16,185,129,.3)",
              borderRadius: "4px",
              padding: ".6rem .8rem",
              marginBottom: "1rem",
              fontSize: ".78rem",
              color: "#10b981",
              fontWeight: 700,
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="liquid-btn"
            disabled={loading}
            style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
          >
            <span>{loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}</span>
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.2rem" }}>
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setSuccess(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--teal)",
              cursor: "pointer",
              fontSize: ".82rem",
              fontWeight: 700,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            {mode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
