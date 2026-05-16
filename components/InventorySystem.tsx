"use client";

import { useState, useEffect } from "react";
import { 
  getInventory, 
  addInventoryTransaction, 
  getInventoryLogs, 
  getOpeningStock, 
  updateInventoryLog,
  deleteInventoryLog,
  updateProductStockManual,
  type InventoryItem, 
  type InventoryLog 
} from "@/lib/supabase";

interface InventorySystemProps {
  user: any;
  showToast: (msg: string) => void;
}

export default function InventorySystem({ user, showToast }: InventorySystemProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [deletedLogs, setDeletedLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'report' | 'history' | 'stock' | 'deleted'>('summary');
  const isOwner = user?.role === 'owner';

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

    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'history') {
      await loadHistory();
    } else if (activeTab === 'deleted') {
      const del = await getInventoryLogs("2000-01-01", "2100-12-31", true);
      setDeletedLogs(del);
    } else {
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
      showToast(`✓ ${form.type.replace('_', ' ')} recorded!`);
      setForm({ ...form, brand: "", model: "", imei: "", quantity: 1 });
      fetchData();
    }
  };

  const handleEditLog = async (logId: string, oldQty: number) => {
    const newQtyStr = prompt("Enter new quantity:", oldQty.toString());
    if (newQtyStr === null) return;
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty) || newQty < 0) {
      showToast("Invalid quantity");
      return;
    }

    const { error } = await updateInventoryLog(logId, newQty, user.id);
    if (error) showToast("Error updating entry");
    else {
      showToast("✓ Entry updated");
      fetchData();
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Are you sure you want to delete this entry? It will be moved to Recycle Bin.")) return;
    const { error } = await deleteInventoryLog(logId, user.id);
    if (error) showToast("Error deleting entry");
    else {
      showToast("🗑 Entry moved to Recycle Bin");
      fetchData();
    }
  };

  const handleManualStockEdit = async (item: InventoryItem) => {
    if (!isOwner) return;
    const newQtyStr = prompt(`Manual Stock Adjustment for ${item.brand} ${item.model}\nCurrent: ${item.quantity}\nEnter NEW Total Stock:`, item.quantity.toString());
    if (newQtyStr === null) return;
    const newQty = parseInt(newQtyStr);
    if (isNaN(newQty)) {
      showToast("Invalid number");
      return;
    }

    const { error } = await updateProductStockManual(item.id, newQty, user.id);
    if (error) showToast("Error updating stock");
    else {
      showToast("✓ Stock adjusted manually");
      fetchData();
    }
  };

  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="owner-card inventory-root" style={{ 
      marginTop: "1rem", 
      minHeight: "500px",
      position: "relative",
      zIndex: 9999,
      pointerEvents: "auto",
      overflow: "visible"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0 }}>Inventory System</h3>
        <div style={{ background: "rgba(81,150,206,0.12)", padding: ".4rem .8rem", borderRadius: "6px", fontSize: ".7rem", color: "#5196CE", fontWeight: 700, border: "1px solid rgba(81,150,206,0.25)" }}>
          TOTAL STOCK: {totalStock}
        </div>
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: ".5rem" }}>
        {['summary', 'report', 'stock', 'history', 'deleted'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`inv-btn ${activeTab === tab ? '' : 'del'}`}
            style={{ 
              padding: ".4rem 1rem", 
              fontSize: ".65rem", 
              whiteSpace: "nowrap",
              background: activeTab === tab ? "#5196CE" : "transparent",
              color: activeTab === tab ? "#fff" : "rgba(216,207,188,0.5)",
              borderColor: activeTab === tab ? "#5196CE" : "rgba(216,207,188,0.12)"
            }}
          >
            {tab === 'deleted' ? '♻ RECYCLE BIN' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="stat-card">
            <label>Today's Sales</label>
              <div className="value" style={{ color: "#5196CE" }}>{logs.filter(l => l.type === 'SALE').reduce((s, l) => s + l.quantity, 0)}</div>
          </div>
          <div className="stat-card">
            <label>New Stock Today</label>
            <div className="value" style={{ color: "#4aad8a" }}>{logs.filter(l => l.type === 'NEW_STOCK').reduce((s, l) => s + l.quantity, 0)}</div>
          </div>
          <div className="stat-card" style={{ gridColumn: "span 2" }}>
            <label>Recent Transactions</label>
            <div style={{ marginTop: ".5rem" }}>
              {logs.slice(0, 5).map(log => (
                <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: ".7rem", padding: ".6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{log.inventory?.brand} {log.inventory?.model}</span>
                    <span style={{ fontSize: ".55rem", color: "#666" }}>By {log.profiles?.full_name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".8rem" }}>
                    <span style={{ color: log.type === 'SALE' ? '#df2531' : '#4aad8a', fontWeight: 700 }}>{log.type === 'SALE' ? '-' : '+'}{log.quantity}</span>
                  <button onClick={() => handleEditLog(log.id, log.quantity)} style={{ background: "none", border: "none", color: "#5196CE", cursor: "pointer", fontSize: ".7rem", padding: "2px 4px" }}>✎</button>
                  <button onClick={() => handleDeleteLog(log.id)} style={{ background: "none", border: "none", color: "#df2531", cursor: "pointer", fontSize: ".7rem", padding: "2px 4px" }}>🗑</button>
                  </div>
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
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }}>
                <option value="SALE">SALE</option>
                <option value="NEW_STOCK">NEW STOCK</option>
                <option value="RETURN">STOCK RETURN (TO SUPPLIER)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }} />
            </div>
            <div className="input-group">
              <label>Brand Name</label>
              <input type="text" placeholder="e.g. Apple" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }} />
            </div>
            <div className="input-group">
              <label>Model Name</label>
              <input type="text" placeholder="e.g. iPhone 15" value={form.model} onChange={e => setForm({...form, model: e.target.value})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }} />
            </div>
            <div className="input-group">
              <label>IMEI (Optional)</label>
              <input type="text" placeholder="15-digit" value={form.imei} onChange={e => setForm({...form, imei: e.target.value})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }} />
            </div>
            <div className="input-group">
              <label>Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 1})} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }} />
            </div>
          </div>
          <button type="submit" className="inv-btn" style={{ padding: ".8rem", minHeight: "48px", fontWeight: "bold" }}>SUBMIT REPORT</button>
        </form>
      )}

      {activeTab === 'stock' && (
        <div style={{ overflowX: "auto" }}>
          <table className="inv-table">
            <thead>
              <tr><th>Brand</th><th>Model</th><th>Stock</th>{isOwner && <th>Edit</th>}</tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700 }}>{item.brand}</td>
                  <td>{item.model}</td>
                  <td style={{ color: item.quantity < 5 ? '#b58863' : '#d8cfbc' }}>{item.quantity}</td>
                  {isOwner && (
                    <td>
                      <button onClick={() => handleManualStockEdit(item)} style={{ background: "none", border: "none", color: "#5196CE", cursor: "pointer", fontSize: ".7rem", padding: "4px" }}>✎ Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
           <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: ".55rem", color: "#666", display: "block", marginBottom: "4px" }}>MONTH</label>
                <select value={historyMonth} onChange={e => setHistoryMonth(parseInt(e.target.value))} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }}>
                  {Array.from({length: 12}).map((_, i) => <option key={i} value={i}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: ".55rem", color: "#9a9387", display: "block", marginBottom: "4px" }}>YEAR</label>
                <select value={historyYear} onChange={e => setHistoryYear(parseInt(e.target.value))} style={{ width: "100%", background: "#0f100c", color: "#d8cfbc", border: "1px solid rgba(216,207,188,0.2)", padding: ".6rem", borderRadius: "6px", fontSize: "16px" }}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button 
                onClick={() => fetchData()} 
                style={{ alignSelf: "flex-end", background: "rgba(81,150,206,0.1)", border: "1px solid rgba(81,150,206,0.25)", color: "#5196CE", padding: ".6rem .8rem", borderRadius: "6px", fontSize: ".8rem", cursor: "pointer", minHeight: "48px" }}
              >
                ↻
              </button>
           </div>
           <div style={{ maxHeight: "500px", overflowY: "auto", position: "relative" }}>
              {loading && activeTab === 'history' && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <span style={{ fontSize: ".7rem", color: "var(--teal-glow)" }}>Updating Data...</span>
                </div>
              )}
              {dailyStats.map(day => (
                <div key={day.date} className="history-row" onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)} style={{ background: "rgba(6,57,47,0.12)", padding: ".8rem", borderRadius: "8px", marginBottom: ".5rem", borderLeft: "3px solid #5196CE", cursor: "pointer", transition: "background 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".5rem" }}>
                    <span style={{ fontSize: ".75rem", fontWeight: 700 }}>{new Date(day.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</span>
                    <span style={{ fontSize: ".6rem", color: "#888" }}>{expandedDate === day.date ? '▲ Close' : '▼ Details'}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: ".5rem", textAlign: "center" }}>
                    <div><div style={{ fontSize: ".55rem", color: "#9a9387" }}>OPENING</div><div style={{ fontSize: ".8rem", fontWeight: 600 }}>{day.opening}</div></div>
                    <div><div style={{ fontSize: ".55rem", color: "#df2531" }}>SALES</div><div style={{ fontSize: ".8rem" }}>{day.sales}</div></div>
                    <div><div style={{ fontSize: ".55rem", color: "#4aad8a" }}>NEW</div><div style={{ fontSize: ".8rem" }}>{day.newStock}</div></div>
                    <div><div style={{ fontSize: ".55rem", color: "#5196CE" }}>CLOSING</div><div style={{ fontSize: ".8rem", fontWeight: 700, color: "#b58863" }}>{day.closing}</div></div>
                  </div>
                  {expandedDate === day.date && (
                    <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
                      {day.logs.map((log: any) => (
                        <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".68rem", padding: ".5rem", background: "rgba(255,255,255,0.02)", borderRadius: "4px", marginBottom: ".3rem" }}>
                           <div style={{ display: "flex", flexDirection: "column" }}>
                             <span style={{ fontWeight: 700 }}>{log.inventory?.brand} {log.inventory?.model}</span>
                             <span style={{ fontSize: ".55rem", color: "#666" }}>By {log.profiles?.full_name} {log.editor && `| Ed: ${log.editor.full_name}`}</span>
                           </div>
                           <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                             <span style={{ fontSize: ".6rem", padding: "2px 6px", borderRadius: "4px", background: log.type === 'SALE' ? 'rgba(223,37,49,0.12)' : 'rgba(6,57,47,0.25)', color: log.type === 'SALE' ? '#df2531' : '#4aad8a', fontWeight: "bold" }}>{log.type}</span>
                             <span style={{ fontWeight: 700 }}>{log.quantity}</span>
                             <button onClick={(e) => { e.stopPropagation(); handleEditLog(log.id, log.quantity); }} style={{ background: "none", border: "none", color: "#5196CE", fontSize: ".7rem", padding: "2px 4px" }}>✎</button>
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.id); }} style={{ background: "none", border: "none", color: "#df2531", fontSize: ".7rem", padding: "2px 4px" }}>🗑</button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'deleted' && (
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {deletedLogs.map(log => (
            <div key={log.id} style={{ background: "rgba(223,37,49,0.06)", padding: ".8rem", borderRadius: "8px", marginBottom: ".5rem", borderLeft: "3px solid #df2531" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
                <span style={{ fontWeight: 700, fontSize: ".75rem" }}>{log.inventory?.brand} {log.inventory?.model}</span>
                <span style={{ fontSize: ".6rem", color: "#df2531", fontWeight: 700 }}>REMOVED</span>
              </div>
              <div style={{ fontSize: ".65rem", color: "#9a9387" }}>
                Original Type: {log.type} | Qty: {log.quantity}<br/>
                Deleted by: <b style={{ color: "#d8cfbc" }}>{log.remover?.full_name}</b> on {new Date(log.deleted_at!).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
          {deletedLogs.length === 0 && <p style={{ textAlign: "center", color: "#9a9387", fontSize: ".7rem" }}>Recycle Bin is empty</p>}
        </div>
      )}

      <style jsx>{`
        .stat-card { background: rgba(6,57,47,0.15); padding: 1rem; border-radius: 10px; border: 1px solid rgba(216,207,188,0.08); }
        .stat-card label { display: block; font-size: .6rem; color: #9a9387; text-transform: uppercase; margin-bottom: .2rem; }
        .stat-card .value { font-size: 1.5rem; font-weight: 800; color: var(--blue); }
        .input-group label { display: block; font-size: .65rem; color: #9a9387; margin-bottom: .3rem; pointer-events: none; }
        .history-row:hover { background: rgba(6,57,47,0.2) !important; }

        .inventory-root * {
          pointer-events: auto !important;
        }

        .inv-btn {
          background: rgba(81,150,206,0.12) !important;
          color: #5196CE !important;
          border: 1px solid rgba(81,150,206,0.3) !important;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          width: 100%;
          position: relative;
          z-index: 10001;
        }
        .inv-btn:active { transform: scale(0.95) !important; }
        .inv-btn:hover { background: #5196CE !important; color: #fff !important; box-shadow: 0 4px 16px rgba(81,150,206,0.3) !important; }
        .inv-btn.del {
          background: rgba(223,37,49,0.06) !important;
          color: #df2531 !important;
          border: 1px solid rgba(223,37,49,0.25) !important;
        }
        .inv-btn.del:hover { background: #df2531 !important; color: #fff !important; }

        .inv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .75rem;
        }
        .inv-table th {
          text-align: left;
          padding: .8rem;
          background: rgba(6,57,47,0.2);
          color: #5196CE;
          font-weight: 600;
          text-transform: uppercase;
          font-size: .6rem;
          letter-spacing: 1px;
        }
        .inv-table td {
          padding: .8rem;
          border-bottom: 1px solid rgba(216,207,188,0.04);
          color: #d8cfbc;
        }
        
        .input-group input, .input-group select {
          width: 100% !important;
          background: #0f100c !important;
          color: #d8cfbc !important;
          border: 1px solid rgba(216,207,188,0.2) !important;
          padding: .8rem !important;
          border-radius: 8px !important;
          font-size: 16px !important;
          height: 50px !important;
          outline: none !important;
          position: relative;
          z-index: 10001;
        }
        .input-group input:focus, .input-group select:focus {
          border-color: #5196CE !important;
          box-shadow: 0 0 0 2px rgba(81,150,206,0.15) !important;
        }

        @media (max-width: 768px) {
          .inv-table { font-size: .7rem; }
          .inv-table th, .inv-table td { padding: .6rem; }
          .owner-card { padding: 1rem !important; margin-bottom: 2rem; }
          .stat-card { padding: .8rem; }
        }
      `}</style>
    </div>
  );
}
