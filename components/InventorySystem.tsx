"use client";

import { useState, useEffect } from "react";
import { getInventory, addInventoryTransaction, getInventoryLogs, getOpeningStock, type InventoryItem, type InventoryLog } from "@/lib/supabase";

interface InventorySystemProps {
  user: any;
  showToast: (msg: string) => void;
}

export default function InventorySystem({ user, showToast }: InventorySystemProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'report' | 'history' | 'stock'>('summary');
  
  // Form State
  const [form, setForm] = useState({
    brand: "",
    model: "",
    imei: "",
    quantity: 1,
    type: "SALE" as "SALE" | "NEW_STOCK" | "RETURN",
    date: new Date().toISOString().split('T')[0]
  });

  // History State
  const [historyMonth, setHistoryMonth] = useState(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, historyMonth, historyYear]);

  const fetchData = async () => {
    setLoading(true);
    const inv = await getInventory();
    setInventory(inv);

    if (activeTab === 'history') {
      await loadHistory();
    } else {
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = await getInventoryLogs(today, today);
      setLogs(todayLogs);
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    const daysInMonth = new Date(historyYear, historyMonth + 1, 0).getDate();
    const stats = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${historyYear}-${String(historyMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayLogs = await getInventoryLogs(dateStr, dateStr);
      const opening = await getOpeningStock(dateStr);
      
      let sales = 0, newStock = 0, returns = 0;
      dayLogs.forEach(l => {
        if (l.type === 'SALE') sales += l.quantity;
        if (l.type === 'NEW_STOCK') newStock += l.quantity;
        if (l.type === 'RETURN') returns += l.quantity;
      });

      stats.push({
        date: dateStr,
        opening,
        sales,
        newStock,
        returns,
        closing: opening + newStock - sales - returns,
        logs: dayLogs
      });
    }
    setDailyStats(stats.reverse());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model) {
      showToast("Please enter Brand and Model");
      return;
    }

    const { error } = await addInventoryTransaction(
      { brand: form.brand, model: form.model, imei: form.imei },
      form.type,
      form.quantity,
      form.date,
      user.id
    );

    if (error) {
      showToast("Error recording transaction");
    } else {
      showToast(`✓ ${form.type.replace('_', ' ')} recorded successfully!`);
      setForm({ ...form, brand: "", model: "", imei: "", quantity: 1 });
      fetchData();
    }
  };

  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="owner-card" style={{ marginTop: "1rem", minHeight: "500px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0 }}>Inventory System</h3>
        <div style={{ background: "rgba(45, 212, 191, 0.1)", padding: ".4rem .8rem", borderRadius: "4px", fontSize: ".7rem", color: "#2DD4BF", fontWeight: 700 }}>
          TOTAL STOCK: {totalStock}
        </div>
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: ".5rem" }}>
        {['summary', 'report', 'stock', 'history'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`inv-btn ${activeTab === tab ? '' : 'del'}`}
            style={{ 
              padding: ".4rem 1rem", 
              fontSize: ".65rem", 
              whiteSpace: "nowrap",
              background: activeTab === tab ? "var(--teal-glow)" : "transparent",
              borderColor: activeTab === tab ? "var(--teal-glow)" : "rgba(255,255,255,0.1)"
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="stat-card">
            <label>Today's Sales</label>
            <div className="value">{logs.filter(l => l.type === 'SALE').reduce((s, l) => s + l.quantity, 0)}</div>
          </div>
          <div className="stat-card">
            <label>New Stock Today</label>
            <div className="value" style={{ color: "#10b981" }}>{logs.filter(l => l.type === 'NEW_STOCK').reduce((s, l) => s + l.quantity, 0)}</div>
          </div>
          <div className="stat-card" style={{ gridColumn: "span 2" }}>
            <label>Recent Transactions</label>
            <div style={{ marginTop: ".5rem" }}>
              {logs.slice(0, 5).map(log => (
                <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".7rem", padding: ".4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span>{log.inventory?.brand} {log.inventory?.model}</span>
                  <span style={{ color: log.type === 'SALE' ? '#ef4444' : '#10b981' }}>{log.type === 'SALE' ? '-' : '+'}{log.quantity}</span>
                </div>
              ))}
              {logs.length === 0 && <p style={{ fontSize: ".65rem", color: "#555" }}>No transactions today</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem" }}>
            <div className="input-group">
              <label>Transaction Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value as any})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              >
                <option value="SALE">SALE</option>
                <option value="NEW_STOCK">NEW STOCK</option>
                <option value="RETURN">STOCK RETURN (TO SUPPLIER)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date</label>
              <input 
                type="date" 
                value={form.date} 
                onChange={e => setForm({...form, date: e.target.value})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              />
            </div>
            <div className="input-group">
              <label>Brand Name</label>
              <input 
                type="text" 
                placeholder="e.g. Apple" 
                value={form.brand} 
                onChange={e => setForm({...form, brand: e.target.value})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              />
            </div>
            <div className="input-group">
              <label>Model Name</label>
              <input 
                type="text" 
                placeholder="e.g. iPhone 15" 
                value={form.model} 
                onChange={e => setForm({...form, model: e.target.value})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              />
            </div>
            <div className="input-group">
              <label>IMEI (Optional)</label>
              <input 
                type="text" 
                placeholder="15-digit number" 
                value={form.imei} 
                onChange={e => setForm({...form, imei: e.target.value})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              />
            </div>
            <div className="input-group">
              <label>Quantity</label>
              <input 
                type="number" 
                min="1"
                value={form.quantity} 
                onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
                style={{ width: "100%", background: "#111", color: "#fff", border: "1px solid #333", padding: ".5rem", borderRadius: "4px", fontSize: ".75rem" }}
              />
            </div>
          </div>
          <button type="submit" className="inv-btn" style={{ padding: ".8rem" }}>SUBMIT REPORT</button>
        </form>
      )}

      {activeTab === 'stock' && (
        <div style={{ overflowX: "auto" }}>
          <table className="inv-table">
            <thead>
              <tr><th>Brand</th><th>Model</th><th>Stock</th></tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700 }}>{item.brand}</td>
                  <td>{item.model}</td>
                  <td style={{ color: item.quantity < 5 ? '#f59e0b' : '#fff' }}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
           <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <select 
                value={historyMonth} 
                onChange={e => setHistoryMonth(parseInt(e.target.value))}
                style={{ flex: 1, background: "#111", color: "#fff", border: "1px solid #333", padding: ".4rem", borderRadius: "4px", fontSize: ".7rem" }}
              >
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i} value={i}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>
                ))}
              </select>
              <select 
                value={historyYear} 
                onChange={e => setHistoryYear(parseInt(e.target.value))}
                style={{ flex: 1, background: "#111", color: "#fff", border: "1px solid #333", padding: ".4rem", borderRadius: "4px", fontSize: ".7rem" }}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>

           <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {dailyStats.map(day => (
                <div 
                  key={day.date} 
                  onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)}
                  style={{ 
                    background: "rgba(255,255,255,0.03)", 
                    padding: ".8rem", 
                    borderRadius: "6px", 
                    marginBottom: ".5rem",
                    borderLeft: "3px solid var(--teal-glow)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  className="history-row"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
                    <span style={{ fontSize: ".75rem", fontWeight: 700 }}>{new Date(day.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</span>
                    <span style={{ fontSize: ".6rem", color: "#888" }}>{expandedDate === day.date ? '▲ Close' : '▼ Details'}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: ".5rem", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: ".55rem", color: "#888" }}>OPENING</div>
                      <div style={{ fontSize: ".8rem" }}>{day.opening}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: ".55rem", color: "#ef4444" }}>SALES</div>
                      <div style={{ fontSize: ".8rem" }}>{day.sales}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: ".55rem", color: "#10b981" }}>NEW</div>
                      <div style={{ fontSize: ".8rem" }}>{day.newStock}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: ".55rem", color: "var(--teal-glow)" }}>CLOSING</div>
                      <div style={{ fontSize: ".8rem", fontWeight: 700 }}>{day.closing}</div>
                    </div>
                  </div>

                  {expandedDate === day.date && (
                    <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
                      <div style={{ fontSize: ".6rem", color: "var(--teal-glow)", fontWeight: 700, marginBottom: ".4rem", letterSpacing: "1px" }}>TRANSACTION DETAILS</div>
                      {day.logs.map((log: any) => (
                        <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".68rem", padding: ".5rem", background: "rgba(255,255,255,0.02)", borderRadius: "4px", marginBottom: ".3rem" }}>
                           <div style={{ display: "flex", flexDirection: "column" }}>
                             <span style={{ fontWeight: 700 }}>{log.inventory?.brand} {log.inventory?.model}</span>
                             <span style={{ fontSize: ".55rem", color: "#666" }}>{new Date(log.created_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</span>
                           </div>
                           <div style={{ textAlign: "right" }}>
                             <span style={{ 
                               fontSize: ".6rem", 
                               padding: "2px 6px", 
                               borderRadius: "2px",
                               background: log.type === 'SALE' ? 'rgba(239,68,68,0.1)' : (log.type === 'NEW_STOCK' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'),
                               color: log.type === 'SALE' ? '#ef4444' : (log.type === 'NEW_STOCK' ? '#10b981' : '#f59e0b'),
                               fontWeight: "bold",
                               marginRight: ".5rem"
                             }}>
                               {log.type}
                             </span>
                             <span style={{ fontWeight: 700 }}>{log.quantity}</span>
                           </div>
                        </div>
                      ))}
                      {day.logs.length === 0 && <p style={{ fontSize: ".65rem", color: "#555", textAlign: "center" }}>No detailed logs for this day</p>}
                    </div>
                  )}
                </div>
              ))}
           </div>
        </div>
      )}

      <style jsx>{`
        .stat-card {
          background: rgba(255,255,255,0.03);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .stat-card label {
          display: block;
          font-size: .6rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: .2rem;
        }
        .stat-card .value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--teal-glow);
        }
        .input-group label {
          display: block;
          font-size: .65rem;
          color: #888;
          margin-bottom: .3rem;
        }
        .history-row:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </div>
  );
}
