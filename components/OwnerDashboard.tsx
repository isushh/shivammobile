"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { getPendingStaff, getAllStaff, approveStaff, rejectStaff, getTodayAllAttendance, getShopLocation, updateShopLocation, type Profile } from "@/lib/supabase";

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

const PRODUCTS_DATA = [
  { id: 1, brand: "Apple", name: "iPhone 16 Pro", price: "₹1,34,900", stock: 5 },
  { id: 2, brand: "Apple", name: "iPhone 15", price: "₹74,900", stock: 8 },
  { id: 3, brand: "Apple", name: "iPhone 14", price: "₹59,900", stock: 12 },
  { id: 4, brand: "Samsung", name: "Galaxy S24 Ultra", price: "₹1,29,999", stock: 6 },
  { id: 5, brand: "Samsung", name: "Galaxy A55", price: "₹37,999", stock: 10 },
  { id: 6, brand: "Samsung", name: "Galaxy M55", price: "₹24,999", stock: 14 },
  { id: 7, brand: "Vivo", name: "Vivo V30 Pro", price: "₹44,999", stock: 7 },
  { id: 8, brand: "Vivo", name: "Vivo T3x 5G", price: "₹12,999", stock: 15 },
  { id: 9, brand: "Sony", name: "Xperia 1 VI", price: "₹1,09,990", stock: 3 },
  { id: 10, brand: "Xiaomi", name: "Xiaomi 14 Ultra", price: "₹99,999", stock: 4 },
  { id: 11, brand: "Xiaomi", name: "Redmi Note 13", price: "₹16,999", stock: 9 },
];

import { SPEC_DB } from "@/lib/specDb";

interface OwnerDashboardProps {
  showToast: (msg: string) => void;
}

export default function OwnerDashboard({ showToast }: OwnerDashboardProps) {
  const [inventory, setInventory] = useState(PRODUCTS_DATA);
  const [clock, setClock] = useState("");
  const [scraperInput, setScraperInput] = useState("");
  const [specResult, setSpecResult] = useState<Record<string, string> | null>(null);
  const [specError, setSpecError] = useState<string | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [pendingStaff, setPendingStaff] = useState<Profile[]>([]);
  const [allStaff, setAllStaff] = useState<Profile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [shopLoc, setShopLoc] = useState({ lat: 26.383, lng: 85.4833 });

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("en-IN") + " IST");
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const pending = await getPendingStaff();
    const all = await getAllStaff();
    const { data: attData } = await getTodayAllAttendance();
    const loc = await getShopLocation();
    
    setPendingStaff(pending);
    setAllStaff(all);
    setAttendanceRecords(attData || []);
    setShopLoc({ lat: loc.lat, lng: loc.lng });
  };

  const setShopToCurrent = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported");
      return;
    }
    showToast("Getting precise location...");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { error } = await updateShopLocation(latitude, longitude);
      if (error) {
        showToast("Failed to update location");
      } else {
        setShopLoc({ lat: latitude, lng: longitude });
        showToast("✓ Shop location updated successfully!");
      }
    }, (err) => showToast("Permission denied"), { enableHighAccuracy: true });
  };

  const handleApprove = async (id: string) => {
    const { error } = await approveStaff(id);
    if (error) {
      showToast("Failed to approve staff");
    } else {
      showToast("Staff approved ✓");
      loadData();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await rejectStaff(id);
    if (error) {
      showToast("Failed to reject staff");
    } else {
      showToast("Staff request rejected");
      loadData();
    }
  };

  const deleteProd = (id: number) => {
    setInventory((prev) => prev.filter((p) => p.id !== id));
    showToast("Product removed from inventory");
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
            COMMAND_CENTER
          </h2>
          <p style={{ fontSize: ".7rem", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
            owner@shivammobilecare:~$ live_dashboard --realtime
          </p>
        </div>
        <div className="live-clock">{clock}</div>
      </div>

      {/* Stats Row */}
      <div className="o-grid-top">
        <div className="owner-card">
          <h3>Today&apos;s Revenue</h3>
          <div className="stat-num">₹48,200</div>
          <div style={{ fontSize: ".72rem", color: "#10b981", marginTop: ".2rem" }}>↑ 12% vs yesterday</div>
          <svg className="mini-svg" viewBox="0 0 200 60" height="60">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <polygon points="0,55 35,40 70,45 100,20 135,28 165,12 200,8 200,60 0,60" fill="url(#lg)" />
            <polyline points="0,55 35,40 70,45 100,20 135,28 165,12 200,8" fill="none" stroke="#2DD4BF" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="owner-card">
          <h3>Total Inventory</h3>
          <div className="stat-num">87</div>
          <div style={{ fontSize: ".72rem", color: "#888", marginTop: ".2rem" }}>Units in stock</div>
          <div className="chip-row">
            <span className="chip">Apple ×18</span>
            <span className="chip">Samsung ×24</span>
            <span className="chip">Vivo ×21</span>
            <span className="chip">Other ×24</span>
          </div>
        </div>

        <div className="owner-card">
          <h3>Staff On Duty</h3>
          <div className="stat-num">
            {allStaff.filter(s => attendanceRecords.some(r => r.staff_id === s.id && r.type === 'IN')).length} / {allStaff.length}
          </div>
          <div style={{ fontSize: ".72rem", color: "#888", marginTop: ".2rem" }}>Checked in today</div>
          <div className="chip-row">
            {allStaff.map(s => {
              const active = attendanceRecords.some(r => r.staff_id === s.id && r.type === 'IN');
              return (
                <span key={s.id} className="chip" style={{ 
                  background: active ? "rgba(16,185,129,.12)" : "rgba(255,255,255,.05)", 
                  color: active ? "#10b981" : "#555",
                  border: active ? "1px solid rgba(16,185,129,.2)" : "1px solid transparent"
                }}>
                  {s.full_name.split(' ').map(n => n[0]).join('')} {active ? '✓' : ''}
                </span>
              );
            })}
          </div>
        </div>

        <div className="owner-card" style={{ border: "1px solid var(--teal-glow)", boxShadow: "0 0 15px rgba(45, 212, 191, 0.1)" }}>
          <h3>Shop Location Map</h3>
          <p style={{ fontSize: ".65rem", color: "#888", marginBottom: ".8rem" }}>
            Select your shop on the map or click &quot;Pin Point&quot; while standing inside.
          </p>

          <LocationPicker 
            initialPos={shopLoc} 
            onLocationSelect={(lat, lng) => setShopLoc({ lat, lng })}
          />

          <div style={{ display: "flex", gap: ".5rem", marginTop: ".8rem" }}>
            <button 
                className="inv-btn" 
                onClick={() => updateShopLocation(shopLoc.lat, shopLoc.lng).then(() => showToast("✓ Shop location saved!"))}
                style={{ flex: 1, padding: ".5rem", fontSize: ".7rem" }}
            >
                Save Map Pos
            </button>
            <button 
                className="inv-btn" 
                onClick={setShopToCurrent}
                style={{ flex: 1, padding: ".5rem", fontSize: ".7rem", background: "rgba(45, 212, 191, 0.1)" }}
            >
                📍 Pin Point
            </button>
          </div>
          <p style={{ fontSize: ".6rem", color: "#666", marginTop: ".6rem", textAlign: "center" }}>
            Lat: {shopLoc.lat.toFixed(6)} | Lng: {shopLoc.lng.toFixed(6)}
          </p>
        </div>
      </div>

      {/* Staff Approval Panel */}
      <div className="owner-card" style={{ marginBottom: "1rem" }}>
        <h3>Staff Management</h3>
        {pendingStaff.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: ".72rem", color: "#f59e0b", fontWeight: 700, marginBottom: ".5rem", letterSpacing: "1px" }}>
              ⚠ PENDING APPROVAL ({pendingStaff.length})
            </div>
            {pendingStaff.map((s) => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: ".6rem .8rem", border: "1px solid rgba(245,158,11,.3)",
                borderRadius: "2px", marginBottom: ".4rem", background: "rgba(245,158,11,.05)",
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: ".85rem", color: "#F5F5F5" }}>{s.full_name}</span>
                  <span style={{ fontSize: ".68rem", color: "#888", marginLeft: ".5rem" }}>
                    {new Date(s.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div style={{ display: "flex", gap: ".4rem" }}>
                  <button className="inv-btn" onClick={() => handleApprove(s.id)} style={{ padding: ".25rem .7rem" }}>
                    ✓ Approve
                  </button>
                  <button className="inv-btn del" onClick={() => handleReject(s.id)} style={{ padding: ".25rem .7rem" }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <table className="inv-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Status</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {allStaff.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700 }}>{s.full_name}</td>
                <td>{s.role}</td>
                <td>
                  <span style={{
                    fontSize: ".62rem", fontWeight: 700, padding: ".15rem .5rem",
                    borderRadius: "2px", letterSpacing: ".5px",
                    background: s.is_approved ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)",
                    color: s.is_approved ? "#10b981" : "#f59e0b",
                  }}>
                    {s.is_approved ? "ACTIVE" : "PENDING"}
                  </span>
                </td>
                <td style={{ fontSize: ".72rem" }}>{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
            {allStaff.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "#555", padding: "1rem 0" }}>No staff registered yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mid Row */}
      <div className="o-grid-mid">
        <div className="owner-card">
          <h3>Inventory Manager</h3>
          <table className="inv-table">
            <thead>
              <tr><th>Model</th><th>Qty</th><th>Price</th><th>Act.</th></tr>
            </thead>
            <tbody>
              {inventory.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.name}>{p.name}</td>
                  <td>{p.stock}</td>
                  <td style={{ color: "var(--teal-glow)" }}>{p.price}</td>
                  <td>
                    <button className="inv-btn" onClick={() => showToast("Edit mode — connect to your backend to update")}>Edit</button>{" "}
                    <button className="inv-btn del" onClick={() => deleteProd(p.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="inv-btn" style={{ marginTop: ".8rem", padding: ".3rem 1rem" }} onClick={() => showToast("Add product — connect to Supabase or Firebase")}>
            + Add Product
          </button>
        </div>

        <div className="owner-card">
          <h3>Spec Auto-Fill Tool</h3>
          <div className="scraper-row">
            <input
              type="text"
              value={scraperInput}
              onChange={(e) => setScraperInput(e.target.value)}
              placeholder="e.g. iPhone 16 Pro Max"
              onKeyDown={(e) => e.key === "Enter" && scrapeSpecs()}
            />
            <button onClick={scrapeSpecs}>Fetch Specs</button>
          </div>
          {specLoading && (
            <div className="spec-result">
              <span style={{ color: "#2DD4BF" }}>⟳ Searching specs database...</span>
            </div>
          )}
          {specResult && (
            <div className="spec-result">
              {Object.entries(specResult).map(([k, v]) => (
                <div key={k}>
                  <span className="spec-key">{k}:</span>&nbsp;
                  <span className="spec-val">{v}</span>
                </div>
              ))}
            </div>
          )}
          {specError && (
            <div className="spec-result">
              <span style={{ color: "#f87171" }}>No specs found for &quot;{specError}&quot;.</span>
              <br />
              <span style={{ color: "#666" }}>Try: &quot;iPhone 16 Pro&quot; · &quot;Samsung S24 Ultra&quot; · &quot;Vivo V30 Pro&quot;</span>
            </div>
          )}
          <p style={{ fontSize: ".65rem", color: "#444", marginTop: ".6rem", fontFamily: "'JetBrains Mono', monospace" }}>
            Try: &quot;iPhone 16 Pro&quot; · &quot;Samsung S24 Ultra&quot; · &quot;Vivo V30 Pro&quot;
          </p>
        </div>
      </div>

      <div className="owner-card" style={{ marginBottom: "1.5rem" }}>
        <h3>Live Attendance Tracker</h3>
        <table className="inv-table">
          <thead>
            <tr><th>Staff Name</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Loc.</th><th>Status</th></tr>
          </thead>
          <tbody>
            {allStaff.map(staff => {
              const records = attendanceRecords.filter(r => r.staff_id === staff.id);
              const punchIn = records.find(r => r.type === "IN");
              const punchOut = [...records].reverse().find(r => r.type === "OUT");

              let status = "Absent";
              let color = "#ef4444"; // Red
              let bgColor = "rgba(239, 68, 68, 0.15)";
              let hours = 0;

              if (punchIn) {
                const outTime = punchOut ? new Date(punchOut.created_at).getTime() : new Date().getTime();
                const diffMs = outTime - new Date(punchIn.created_at).getTime();
                hours = diffMs / (1000 * 60 * 60);

                if (punchOut) {
                  if (hours < 8) {
                    status = "Half Day";
                    color = "#f59e0b"; // Yellow
                    bgColor = "rgba(245, 158, 11, 0.15)";
                  } else if (hours >= 8 && hours <= 8.5) {
                    status = "Completed";
                    color = "#10b981"; // Green
                    bgColor = "rgba(16, 185, 129, 0.15)";
                  } else {
                    status = "Extra Hours";
                    color = "#06b6d4"; // Cyan
                    bgColor = "rgba(6, 182, 212, 0.15)";
                  }
                } else {
                  status = "Working";
                  color = "#10b981"; // Green
                  bgColor = "rgba(16, 185, 129, 0.15)";
                }
              }

              return (
                <tr key={staff.id}>
                  <td style={{ fontWeight: 700 }}>{staff.full_name}</td>
                  <td>
                    {punchIn ? (
                      <a 
                        href={punchIn.latitude ? `https://www.google.com/maps?q=${punchIn.latitude},${punchIn.longitude}` : "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "inherit", textDecoration: punchIn.latitude ? "underline" : "none" }}
                        title={punchIn.latitude ? "View on Map" : "No coords"}
                      >
                        {new Date(punchIn.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </a>
                    ) : "-"}
                  </td>
                  <td>
                    {punchOut ? (
                      <a 
                        href={punchOut.latitude ? `https://www.google.com/maps?q=${punchOut.latitude},${punchOut.longitude}` : "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: "inherit", textDecoration: punchOut.latitude ? "underline" : "none" }}
                        title={punchOut.latitude ? "View on Map" : "No coords"}
                      >
                        {new Date(punchOut.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </a>
                    ) : "-"}
                  </td>
                  <td>{punchIn ? `${hours.toFixed(1)} hrs` : "-"}</td>
                  <td>
                    {punchIn?.latitude ? (
                      <a 
                        href={`https://www.google.com/maps?q=${punchIn.latitude},${punchIn.longitude}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: ".65rem", color: "var(--teal-glow)" }}
                      >
                        MAP
                      </a>
                    ) : "-"}
                  </td>
                  <td>
                    <span style={{
                      fontSize: ".65rem", fontWeight: 700, padding: ".2rem .5rem", borderRadius: "4px",
                      background: bgColor, color: color
                    }}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {allStaff.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "#555", padding: "1rem 0" }}>No staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
