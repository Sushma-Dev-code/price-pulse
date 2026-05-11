import { useState, useEffect } from "react";
import axios from "axios";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Bell, Plus, Trash2, TrendingDown, Package } from "lucide-react";

const API = "http://localhost:8000";

export default function App() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ name: "", url: "", alert_threshold: "", user_email: "" });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const res = await axios.get(`${API}/products/`);
    setProducts(res.data);
  }

  async function addProduct(e) {
    e.preventDefault();
    setLoading(true);
    await axios.post(`${API}/products/`, { ...form, alert_threshold: parseFloat(form.alert_threshold) });
    setForm({ name: "", url: "", alert_threshold: "", user_email: "" });
    await fetchProducts();
    setLoading(false);
  }

  async function deleteProduct(id) {
    await axios.delete(`${API}/products/${id}`);
    if (selected?.id === id) { setSelected(null); setHistory([]); }
    await fetchProducts();
  }

  async function viewHistory(product) {
    setSelected(product);
    const res = await axios.get(`${API}/products/${product.id}/history`);
    setHistory(res.data.map(h => ({
      price: h.price,
      time: new Date(h.checked_at).toLocaleDateString()
    })));
  }

  async function checkAll() {
    setChecking(true);
    await axios.post(`${API}/products/check-all`);
    await fetchProducts();
    if (selected) await viewHistory(selected);
    setChecking(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: "#1A5276", color: "white", padding: "16px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <TrendingDown size={28} />
        <h1 style={{ margin: 0, fontSize: 22 }}>PricePulse</h1>
        <span style={{ marginLeft: "auto", fontSize: 14, opacity: 0.8 }}>Live Price Drop Alerts</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 17, color: "#1A5276", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={18} /> Track New Product
          </h2>
          <form onSubmit={addProduct} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "name", placeholder: "Product name (e.g. OnePlus Nord 4)" },
              { key: "url", placeholder: "Product URL" },
              { key: "alert_threshold", placeholder: "Alert me when price drops below (Rs.)" },
              { key: "user_email", placeholder: "Your email for alerts" },
            ].map(f => (
              <input key={f.key} placeholder={f.placeholder} value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })} required
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
            ))}
            <button type="submit" disabled={loading}
              style={{ background: "#1A5276", color: "white", border: "none", padding: "12px", borderRadius: 8, fontSize: 15, cursor: "pointer" }}>
              {loading ? "Adding..." : "Add to Watchlist"}
            </button>
          </form>
        </div>

        <div style={{ background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 17, color: "#1A5276", display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={18} /> Watchlist ({products.length})
            </h2>
            <button onClick={checkAll} disabled={checking}
              style={{ background: checking ? "#aaa" : "#27AE60", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              {checking ? "Checking..." : "Check Prices"}
            </button>
          </div>
          {products.length === 0 && <p style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>No products tracked yet.</p>}
          {products.map(p => (
            <div key={p.id} onClick={() => viewHistory(p)}
              style={{ padding: "12px 14px", borderRadius: 8, marginBottom: 10, cursor: "pointer",
                border: selected?.id === p.id ? "2px solid #1A5276" : "1px solid #eee",
                background: selected?.id === p.id ? "#D6EAF8" : "#fafafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", fontSize: 14 }}>{p.name}</span>
                <button onClick={e => { e.stopPropagation(); deleteProduct(p.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c" }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13, color: "#555" }}>
                <span style={{ color: "#27AE60", fontWeight: "bold" }}>
                  {p.current_price ? `Rs. ${p.current_price}` : "Fetching..."}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Bell size={13} /> Alert at Rs. {p.alert_threshold}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, color: "#1A5276" }}>
              Price History — {selected.name}
            </h2>
            {history.length < 2
              ? <p style={{ color: "#aaa", textAlign: "center" }}>Click "Check Prices" a few times to build history.</p>
              : <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis domain={["auto", "auto"]} fontSize={12} />
                    <Tooltip formatter={v => [`Rs. ${v}`, "Price"]} />
                    <Line type="monotone" dataKey="price" stroke="#1A5276" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>
        )}
      </div>
    </div>
  );
}