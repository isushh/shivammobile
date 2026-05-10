"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { SPEC_DB } from "@/lib/specDb";
import { recordAttendance, getAttendanceHistory, getShopLocation } from "@/lib/supabase";

const StaffMap = dynamic(() => import('./StaffMap'), { ssr: false });
import InventorySystem from "./InventorySystem";

interface StaffDashboardProps {
  showToast: (msg: string) => void;
  userId: string | undefined;
}

interface AttendanceRecord {
  id: string;
  type: "IN" | "OUT";
  created_at: string;
  date: string;
}

export default function StaffDashboard({ showToast, userId }: StaffDashboardProps) {
  const [clock, setClock] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(true);
  const [shopLoc, setShopLoc] = useState({ lat: 26.383, lng: 85.4833 });
  const [currentLoc, setCurrentLoc] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    getShopLocation().then(loc => setShopLoc({ lat: loc.lat, lng: loc.lng }));
    
    if (navigator.geolocation) {
      // Start watching position for continuous high-accuracy updates
      const watchId = navigator.geolocation.watchPosition(
        pos => {
          console.log("Precise Location Update:", pos.coords.latitude, pos.coords.longitude, "Accuracy:", pos.coords.accuracy);
          setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, 
        err => console.error("GPS Error:", err), 
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Camera state for punch in/out
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camMsg, setCamMsg] = useState("Tap a button to punch in or out");
  const [ringSuccess, setRingSuccess] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  // Spec Search State
  const [scraperInput, setScraperInput] = useState("");
  const [specResult, setSpecResult] = useState<Record<string, string> | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);

  // Load Attendance History
  const loadAttendance = useCallback(async () => {
    if (!userId) return;
    setAttLoading(true);
    const { data, error } = await getAttendanceHistory(userId);
    if (!error && data) {
      setAttendance(data as AttendanceRecord[]);
    }
    setAttLoading(false);
  }, [userId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString("en-IN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initCamera = useCallback(() => {
    if (cameraStarted) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setCamStream(stream);
          video.srcObject = stream;
          video.style.display = "block";
          canvas.style.display = "none";
          setCamMsg("Camera ready — smile! 📸");
          setCameraStarted(true);
        })
        .catch(() => {
          video.style.display = "none";
          canvas.style.display = "block";
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 230;
            canvas.height = 230;
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, 230, 230);
            ctx.fillStyle = "#2DD4BF";
            ctx.font = "bold 48px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("📷", 115, 130);
          }
          setCamMsg("Camera unavailable — demo mode");
          setCameraStarted(true);
        });
    }
  }, [cameraStarted]);

  useEffect(() => {
    initCamera();
    return () => {
      if (camStream) {
        camStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initCamera, camStream]);



  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const punch = async (type: "IN" | "OUT") => {
    if (!userId) return;

    if (type === "OUT") {
      const lastPunchIn = attendance.find(a => a.type === "IN");
      if (lastPunchIn) {
        const diffMs = new Date().getTime() - new Date(lastPunchIn.created_at).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 8) {
          const proceed = window.confirm("Your duty hours are not complete and will be marked as Half Day. Do you want to continue?");
          if (!proceed) return;
        }
      }
    }

    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.");
      return;
    }

    showToast("Verifying location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const dist = getDistance(latitude, longitude, shopLoc.lat, shopLoc.lng);
        
        if (accuracy > 200) {
          showToast(`⚠ Poor GPS Accuracy (${Math.round(accuracy)}m). Please wait a moment or move to an open area.`);
          return;
        }

        if (dist > 1000) {
          showToast(`You are too far from the shop (${Math.round(dist / 1000)}km away). You must be within 1km.`);
          return;
        }

        const { error } = await recordAttendance(userId, type, latitude, longitude);
        
        if (error) {
          showToast(`Failed to record Punch ${type}`);
        } else {
          setRingSuccess(true);
          showToast(`Punch ${type} recorded ✓`);
          setTimeout(() => setRingSuccess(false), 3500);
          loadAttendance();
        }
      },
      (err) => {
        showToast("Unable to retrieve your location. Please enable location services.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const checkDistance = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported");
      return;
    }
    showToast("Calculating distance...");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setCurrentLoc({ lat: latitude, lng: longitude });
      const dist = getDistance(latitude, longitude, shopLoc.lat, shopLoc.lng);
      
      const accMsg = accuracy > 100 ? ` (Low Accuracy: ${Math.round(accuracy)}m)` : "";
      
      if (dist <= 1000) {
        showToast(`✓ Within range! (${Math.round(dist)}m away)${accMsg}`);
      } else {
        showToast(`⚠ Out of range: ${Math.round(dist / 1000)}km away.${accMsg}`);
      }
    }, () => showToast("Permission denied"), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };

  const scrapeSpecs = () => {
    const q = scraperInput.trim().toLowerCase();
    if (!q) {
      showToast("Please enter a phone model name");
      return;
    }

    setSpecLoading(true);
    setSpecResult(null);
    setSpecError(null);

    setTimeout(() => {
      const key = Object.keys(SPEC_DB).find((k) =>
        q.split(" ").some((w) => k.includes(w) && w.length > 2)
      );
      if (key) {
        setSpecResult(SPEC_DB[key]);
      } else {
        setSpecError(q);
      }
      setSpecLoading(false);
    }, 700);
  };

  return (
    <div className="owner-page">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-1px", fontFamily: "'JetBrains Mono', monospace", color: "#F5F5F5" }}>
            STAFF_DASHBOARD
          </h2>
          <p style={{ fontSize: ".7rem", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
            staff@shivammobilecare:~$ active
          </p>
        </div>
        <div className="live-clock">{clock}</div>
      </div>

      <div className="o-grid-mid">
        {/* Spec Search (from Owner Dashboard) */}
        <div className="owner-card" style={{ display: "flex", flexDirection: "column" }}>
          <h3>Spec Search</h3>
          <div style={{ fontSize: ".72rem", color: "#888", marginBottom: "1rem" }}>
            Quickly lookup device specifications
          </div>
          
          <div className="scraper-row">
            <input
              type="text"
              className="scraper-input"
              placeholder="e.g. S24 Ultra, iPhone 16..."
              value={scraperInput}
              onChange={(e) => setScraperInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scrapeSpecs()}
            />
            <button className="scraper-btn" onClick={scrapeSpecs} disabled={specLoading}>
              {specLoading ? "..." : "SEARCH"}
            </button>
          </div>

          <div className="spec-results" style={{ flex: 1 }}>
            {specResult && (
              <div>
                <h4 style={{ color: "#2DD4BF", fontSize: ".9rem", marginBottom: ".5rem" }}>
                  {specResult.Brand} {specResult.Model}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
                  {Object.entries(specResult).map(([k, v]) => {
                    if (k === "Brand" || k === "Model") return null;
                    return (
                      <div key={k} style={{ background: "rgba(255,255,255,.03)", padding: ".4rem .6rem", borderRadius: "2px", border: "1px solid rgba(255,255,255,.05)" }}>
                        <div style={{ fontSize: ".55rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>{k}</div>
                        <div style={{ fontSize: ".75rem", color: "#eee", fontWeight: k === "Price" ? 700 : 400 }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {specError && (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#f87171" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>∅</div>
                <div style={{ fontSize: ".75rem" }}>No specs found for "{specError}"</div>
              </div>
            )}
            {!specResult && !specError && !specLoading && (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: ".8rem" }}>
                Ready to search
              </div>
            )}
          </div>
        </div>

        {/* Attendance Panel (Upgraded Staff Portal) */}
        <div className="owner-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ alignSelf: "flex-start" }}>Attendance</h3>
          <p style={{ color: "var(--subtext)", fontSize: ".75rem", margin: ".2rem 0 1rem", alignSelf: "flex-start" }}>
            Punch in or out with a selfie
          </p>

          <div className="camera-wrap" style={{ transform: "scale(0.8)", margin: "-1rem 0" }}>
            <div className={`camera-ring ${ringSuccess ? "success" : ""}`} />
            <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
            <canvas ref={canvasRef} />
          </div>

          <div className="cam-msg" style={{ marginBottom: "1rem" }}>{camMsg}</div>

          <StaffMap staffLoc={currentLoc} shopLoc={shopLoc} />

          {(() => {
            const lastPunchType = attendance.length > 0 ? attendance[0].type : null;
            const canPunchIn = lastPunchType !== "IN";
            const canPunchOut = lastPunchType === "IN";
            
            return (
              <div className="punch-btns" style={{ display: "flex", gap: "1rem", width: "100%", padding: "0 1rem" }}>
                <button 
                  className="punch-btn punch-in" 
                  onClick={() => punch("IN")} 
                  style={{ flex: 1, opacity: canPunchIn ? 1 : 0.3, pointerEvents: canPunchIn ? "auto" : "none", position: "relative", zIndex: 20, padding: "0.8rem", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontWeight: "bold" }}
                >
                  ⬆ Punch In
                </button>
                <button 
                  className="punch-btn punch-out" 
                  onClick={() => punch("OUT")} 
                  style={{ flex: 1, opacity: canPunchOut ? 1 : 0.3, pointerEvents: canPunchOut ? "auto" : "none", position: "relative", zIndex: 20, padding: "0.8rem", borderRadius: "8px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: "bold" }}
                >
                  ⬇ Punch Out
                </button>
              </div>
            );
          })()}

          <button 
            className="inv-btn" 
            onClick={checkDistance}
            style={{ marginTop: "1rem", width: "calc(100% - 2rem)", padding: "0.6rem", fontSize: ".7rem", opacity: 0.8 }}
          >
            📍 Check Distance from Shop
          </button>
        </div>
      </div>

      {/* Attendance History */}
      <div className="owner-card">
        <h3>My Attendance History</h3>
        <table className="inv-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Time</th></tr>
          </thead>
          <tbody>
            {attLoading ? (
              <tr><td colSpan={3} style={{ textAlign: "center", color: "#888" }}>Loading history...</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: "center", color: "#888" }}>No punch records found</td></tr>
            ) : (
              attendance.slice(0, 10).map((a) => {
                const dateObj = new Date(a.created_at);
                return (
                  <tr key={a.id}>
                    <td>{dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td>
                      <span className={a.type === "IN" ? "att-in" : "att-out"} style={{ 
                        fontSize: ".65rem", padding: ".2rem .5rem", borderRadius: "2px", fontWeight: 700,
                        background: a.type === "IN" ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
                        color: a.type === "IN" ? "#10b981" : "#f59e0b"
                      }}>
                        {a.type}
                      </span>
                    </td>
                    <td>{dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


      {userId && <InventorySystem user={{ id: userId }} showToast={showToast} />}
    </div>
  );
}
