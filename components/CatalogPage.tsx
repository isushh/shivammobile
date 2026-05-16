"use client";

import { useState, useEffect } from "react";
import { getPhones, type Phone } from "@/lib/phones";

const BRAND_COLORS: Record<string, string> = {
  Apple: "#5196CE",
  Samsung: "#4aad8a",
  OnePlus: "#df2531",
  Vivo: "#b58863",
  Xiaomi: "#c1d1cf",
  OPPO: "#7b9fa6",
  Google: "#5196CE",
  Motorola: "#4aad8a",
  Nothing: "#d8cfbc",
  Realme: "#df8231",
  iQOO: "#a77bd4",
};

function getBrandColor(brand: string) {
  return BRAND_COLORS[brand] || "#5196CE";
}

function formatLaunchDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isNewLaunch(launchedAt: string | null): boolean {
  if (!launchedAt) return false;
  const days = (Date.now() - new Date(launchedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 60;
}

interface CatalogPageProps {
  showToast: (msg: string) => void;
}

export default function CatalogPage({ showToast }: CatalogPageProps) {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<"popular" | "newest" | "price_asc" | "price_desc">("newest");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Phone | null>(null);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    getPhones().then(data => {
      setPhones(data);
      const b = [...new Set(data.map(p => p.brand))].sort();
      setBrands(b);
      setLoading(false);
    });
  }, []);

  const waLink = (model: string) => {
    const msg = `Hi Shivam Mobile Care, I am interested in the ${model}. Please share more details.`;
    window.open("https://wa.me/919876543210?text=" + encodeURIComponent(msg), "_blank");
    showToast("Opening WhatsApp inquiry...");
  };

  const filtered = phones
    .filter(p => filter === "All" || p.brand === filter)
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "popular") return (a.bestseller_rank ?? 999) - (b.bestseller_rank ?? 999);
      if (sort === "newest") return new Date(b.launched_at ?? 0).getTime() - new Date(a.launched_at ?? 0).getTime();
      if (sort === "price_asc") return (a.price_numeric ?? 0) - (b.price_numeric ?? 0);
      if (sort === "price_desc") return (b.price_numeric ?? 0) - (a.price_numeric ?? 0);
      return 0;
    });

  const newLaunches = filtered.filter(p => isNewLaunch(p.launched_at));
  const rest = filtered.filter(p => !isNewLaunch(p.launched_at));

  return (
    <>
      <div className="section">
        <div className="section-header">
          <h2>Latest Smartphones</h2>
          <p>Live data from Indian market · Auto-updated daily · Tap any card to inquire</p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="🔍 Search phones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", background: "rgba(6,57,47,0.15)",
              border: "1px solid rgba(216,207,188,0.15)", borderRadius: "10px",
              padding: ".75rem 1rem", color: "#d8cfbc", fontSize: "1rem", outline: "none"
            }}
          />
        </div>

        {/* Brand filter */}
        <div className="filter-bar" style={{ marginBottom: ".8rem" }}>
          {["All", ...brands].map(brand => (
            <button
              key={brand}
              className={`filter-chip ${filter === brand ? "active" : ""}`}
              onClick={() => setFilter(brand)}
              style={filter === brand ? { background: getBrandColor(brand), borderColor: getBrandColor(brand), color: "#fff" } : {}}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {([["newest", "🆕 Newest"], ["popular", "🔥 Popular"], ["price_asc", "₹ Low→High"], ["price_desc", "₹ High→Low"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSort(val)}
              style={{
                padding: ".35rem .8rem", fontSize: ".7rem", fontWeight: 700,
                borderRadius: "6px", cursor: "pointer", border: "1px solid",
                background: sort === val ? "#5196CE" : "transparent",
                color: sort === val ? "#fff" : "#9a9387",
                borderColor: sort === val ? "#5196CE" : "rgba(216,207,188,0.12)",
                transition: "all .2s"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9a9387" }}>
            <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📱</div>
            <p>Loading latest phones...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9a9387" }}>
            <p>No phones found for this filter.</p>
          </div>
        )}

        {/* New Launches Section */}
        {!loading && newLaunches.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: ".8rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#df2531", letterSpacing: "2px", textTransform: "uppercase" }}>🔴 New Launches</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(223,37,49,0.2)" }} />
              <span style={{ fontSize: ".6rem", color: "#9a9387" }}>{newLaunches.length} phones</span>
            </div>
            <div className="catalog-grid" style={{ marginBottom: "2rem" }}>
              {newLaunches.map((p, i) => (
                <PhoneCard key={p.id} phone={p} delay={i * 0.04} onClick={() => setModal(p)} onWa={() => waLink(p.name)} />
              ))}
            </div>
          </>
        )}

        {/* All Other Phones */}
        {!loading && rest.length > 0 && (
          <>
            {newLaunches.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: ".8rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#5196CE", letterSpacing: "2px", textTransform: "uppercase" }}>📱 All Phones</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(81,150,206,0.2)" }} />
              </div>
            )}
            <div className="catalog-grid">
              {rest.map((p, i) => (
                <PhoneCard key={p.id} phone={p} delay={i * 0.04} onClick={() => setModal(p)} onWa={() => waLink(p.name)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <div
        className={`modal-overlay ${modal ? "open" : ""}`}
        onClick={e => { if ((e.target as HTMLElement).classList.contains("modal-overlay")) setModal(null); }}
      >
        {modal && (
          <div className="modal-box">
            {isNewLaunch(modal.launched_at) && (
              <div style={{ fontSize: ".6rem", fontWeight: 800, color: "#df2531", letterSpacing: "2px", marginBottom: ".4rem" }}>🔴 NEW LAUNCH</div>
            )}
            <div style={{ fontSize: ".65rem", fontWeight: 800, color: getBrandColor(modal.brand), letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: ".3rem" }}>
              {modal.brand}
            </div>
            <h2 style={{ margin: "0 0 .5rem" }}>{modal.name}</h2>
            {modal.price && (
              <div style={{ color: "#b58863", fontWeight: 900, fontSize: "1.5rem", margin: ".3rem 0", letterSpacing: "-1px" }}>
                {modal.price}
              </div>
            )}
            {modal.emi && <div className="emi-badge" style={{ fontSize: ".72rem" }}>✦ 0% EMI Available</div>}

            <table className="spec-table">
              <tbody>
                {modal.ram && <tr><td>RAM</td><td>{modal.ram}</td></tr>}
                {modal.storage && <tr><td>Storage</td><td>{modal.storage}</td></tr>}
                {modal.camera && <tr><td>Camera</td><td>{modal.camera}</td></tr>}
                {modal.display && <tr><td>Display</td><td>{modal.display}</td></tr>}
                {modal.battery && <tr><td>Battery</td><td>{modal.battery}</td></tr>}
                {modal.os && <tr><td>OS</td><td>{modal.os}</td></tr>}
                {modal.color && <tr><td>Color</td><td>{modal.color}</td></tr>}
                {modal.launched_at && <tr><td>Launched</td><td>{formatLaunchDate(modal.launched_at)}</td></tr>}
              </tbody>
            </table>

            {modal.source_url && (
              <a href={modal.source_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", fontSize: ".65rem", color: "#5196CE", marginBottom: ".8rem", textDecoration: "none" }}>
                🔗 View full specs on MySmartPrice →
              </a>
            )}

            <button className="wa-btn" onClick={() => waLink(modal.name)}>
              💬 Inquire on WhatsApp
            </button>
            <br />
            <button className="close-btn" onClick={() => setModal(null)}>✕ Close</button>
          </div>
        )}
      </div>
    </>
  );
}

function PhoneCard({ phone, delay, onClick, onWa }: {
  phone: Phone; delay: number;
  onClick: () => void; onWa: () => void;
}) {
  const brandColor = getBrandColor(phone.brand);
  const isNew = isNewLaunch(phone.launched_at);

  return (
    <div
      className="prod-card"
      style={{ animationDelay: `${delay}s`, position: "relative", overflow: "hidden" }}
      onClick={onClick}
    >
      {isNew && (
        <div style={{
          position: "absolute", top: 0, right: 0,
          background: "#df2531", color: "#fff",
          fontSize: ".5rem", fontWeight: 900, padding: ".2rem .5rem",
          borderBottomLeftRadius: "6px", letterSpacing: "1px"
        }}>NEW</div>
      )}
      {phone.emi && <div className="emi-badge">✦ 0% EMI</div>}
      <div style={{ fontSize: ".6rem", fontWeight: 800, color: brandColor, letterSpacing: "2px", textTransform: "uppercase", marginBottom: ".3rem" }}>
        {phone.brand}
      </div>
      <div className="prod-name">{phone.name}</div>
      {(phone.ram || phone.camera) && (
        <div className="prod-specs">
          {[phone.ram, phone.storage, phone.camera].filter(Boolean).join(" · ")}
        </div>
      )}
      {phone.price && <div className="prod-price">{phone.price}</div>}
      {phone.launched_at && (
        <div style={{ fontSize: ".58rem", color: "#9a9387", marginTop: ".3rem" }}>
          Launched {formatLaunchDate(phone.launched_at)}
        </div>
      )}
      <button
        className="wa-btn"
        onClick={e => { e.stopPropagation(); onWa(); }}
        style={{ marginTop: ".8rem" }}
      >
        💬 Inquire on WhatsApp
      </button>
    </div>
  );
}
