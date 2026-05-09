"use client";

import { useState } from "react";
import { type Product } from "@/lib/supabase";

const PRODUCTS: Product[] = [
  { id: 1, brand: "Apple", name: "iPhone 16 Pro", price: "₹1,34,900", emi: true, ram: "8 GB", storage: "256 GB", camera: "48 MP Fusion", display: '6.3" Super Retina XDR OLED', battery: "3274 mAh", os: "iOS 18", color: "Natural Titanium" },
  { id: 2, brand: "Apple", name: "iPhone 15", price: "₹74,900", emi: true, ram: "6 GB", storage: "128 GB", camera: "48 MP", display: '6.1" Super Retina XDR OLED', battery: "3349 mAh", os: "iOS 17", color: "Pink" },
  { id: 3, brand: "Apple", name: "iPhone 14", price: "₹59,900", emi: true, ram: "6 GB", storage: "128 GB", camera: "12 MP Dual", display: '6.1" Super Retina XDR', battery: "3279 mAh", os: "iOS 16", color: "Midnight" },
  { id: 4, brand: "Samsung", name: "Galaxy S24 Ultra", price: "₹1,29,999", emi: true, ram: "12 GB", storage: "256 GB", camera: "200 MP Quad", display: '6.8" QHD+ AMOLED 120Hz', battery: "5000 mAh", os: "Android 14", color: "Titanium Black" },
  { id: 5, brand: "Samsung", name: "Galaxy A55", price: "₹37,999", emi: true, ram: "8 GB", storage: "128 GB", camera: "50 MP Triple", display: '6.6" FHD+ AMOLED 120Hz', battery: "5000 mAh", os: "Android 14", color: "Awesome Navy" },
  { id: 6, brand: "Samsung", name: "Galaxy M55", price: "₹24,999", emi: false, ram: "8 GB", storage: "128 GB", camera: "50 MP", display: '6.7" FHD+ AMOLED', battery: "6000 mAh", os: "Android 14", color: "Emerald Brown" },
  { id: 7, brand: "Vivo", name: "Vivo V30 Pro", price: "₹44,999", emi: true, ram: "12 GB", storage: "256 GB", camera: "50 MP ZEISS", display: '6.78" AMOLED 120Hz', battery: "5000 mAh", os: "Android 14", color: "Peacock Green" },
  { id: 8, brand: "Vivo", name: "Vivo T3x 5G", price: "₹12,999", emi: false, ram: "4 GB", storage: "128 GB", camera: "50 MP", display: '6.72" IPS LCD', battery: "6000 mAh", os: "Android 14", color: "Crimson Bliss" },
  { id: 9, brand: "Sony", name: "Xperia 1 VI", price: "₹1,09,990", emi: true, ram: "12 GB", storage: "256 GB", camera: "52 MP Zeiss Triple", display: '6.5" 4K HDR OLED', battery: "5000 mAh", os: "Android 14", color: "Khaki" },
  { id: 10, brand: "Xiaomi", name: "Xiaomi 14 Ultra", price: "₹99,999", emi: true, ram: "16 GB", storage: "512 GB", camera: "50 MP Leica Quad", display: '6.73" LTPO AMOLED', battery: "5000 mAh", os: "Android 14", color: "White" },
  { id: 11, brand: "Xiaomi", name: "Redmi Note 13", price: "₹16,999", emi: false, ram: "6 GB", storage: "128 GB", camera: "108 MP", display: '6.67" AMOLED 120Hz', battery: "5000 mAh", os: "Android 13", color: "Arctic White" },
];

const BRANDS = ["All", "Apple", "Samsung", "Vivo", "Sony", "Xiaomi"];

interface CatalogPageProps {
  showToast: (msg: string) => void;
}

export default function CatalogPage({ showToast }: CatalogPageProps) {
  const [filter, setFilter] = useState("All");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const filtered = filter === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.brand === filter);

  const waLink = (model: string) => {
    const msg = `Hi Shivam Mobile Care, I am interested in the ${model}. Please share more details.`;
    window.open("https://wa.me/919876543210?text=" + encodeURIComponent(msg), "_blank");
    showToast("Opening WhatsApp inquiry...");
  };

  return (
    <>
      <div className="section">
        <div className="section-header">
          <h2>Product Catalog</h2>
          <p>All phones available at 0% EMI. Tap any card for full specs &amp; WhatsApp inquiry.</p>
        </div>

        <div className="filter-bar">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              className={`filter-chip ${filter === brand ? "active" : ""}`}
              onClick={() => setFilter(brand)}
            >
              {brand}
            </button>
          ))}
        </div>

        <div className="catalog-grid">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="prod-card"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => setModalProduct(p)}
            >
              {p.emi && <div className="emi-badge">✦ Available @ 0% EMI</div>}
              <div className="prod-brand">{p.brand}</div>
              <div className="prod-name">{p.name}</div>
              <div className="prod-specs">
                {p.ram} RAM · {p.storage} · {p.camera}
              </div>
              <div className="prod-price">{p.price}</div>
              <button
                className="wa-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  waLink(p.name);
                }}
              >
                💬 Inquire on WhatsApp
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal */}
      <div
        className={`modal-overlay ${modalProduct ? "open" : ""}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains("modal-overlay")) {
            setModalProduct(null);
          }
        }}
      >
        {modalProduct && (
          <div className="modal-box">
            <div className="prod-brand" style={{ color: "var(--teal)", fontSize: ".68rem", letterSpacing: "2.5px" }}>
              {modalProduct.brand}
            </div>
            <h2>{modalProduct.name}</h2>
            <div style={{ color: "var(--teal)", fontWeight: 900, fontSize: "1.5rem", margin: ".3rem 0", letterSpacing: "-1px" }}>
              {modalProduct.price}
            </div>
            {modalProduct.emi && <div className="emi-badge" style={{ fontSize: ".72rem" }}>✦ 0% EMI Available</div>}

            <table className="spec-table">
              <tbody>
                <tr><td>RAM</td><td>{modalProduct.ram}</td></tr>
                <tr><td>Storage</td><td>{modalProduct.storage}</td></tr>
                <tr><td>Camera</td><td>{modalProduct.camera}</td></tr>
                <tr><td>Display</td><td>{modalProduct.display}</td></tr>
                <tr><td>Battery</td><td>{modalProduct.battery}</td></tr>
                <tr><td>OS</td><td>{modalProduct.os}</td></tr>
                <tr><td>Color</td><td>{modalProduct.color}</td></tr>
              </tbody>
            </table>

            <button className="wa-btn" onClick={() => waLink(modalProduct.name)}>
              💬 Inquire on WhatsApp
            </button>
            <br />
            <button className="close-btn" onClick={() => setModalProduct(null)}>
              ✕ Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
