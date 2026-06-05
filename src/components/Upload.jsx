import { useState } from "react";
import { mockTransactions, parseSMS } from "../data/mockData";

export default function Upload({ onData }) {
  const [sms, setSms] = useState("");
  const [mode, setMode] = useState("paste"); // "paste" | "demo"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onData(mockTransactions);
    }, 1200);
  };

  const handlePaste = () => {
    if (!sms.trim()) { setError("Paste at least one SMS message above."); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const txns = parseSMS(sms);
      setLoading(false);
      if (txns.length === 0) {
        setError("Couldn't detect any transactions. Try the demo data, or paste bank debit SMS messages.");
        return;
      }
      onData(txns);
    }, 1000);
  };

  const sampleSMS = `Rs.4299 debited from your account for Amazon.in on 01-Jun-2026. Ref: 123456
Rs.720 debited at Zomato UPI on 01-Jun-2026. Ref: 789012
Rs.2150 spent at Amazon.in on 31-May-2026
Rs.649 debited for Netflix on 30-May-2026`;

  return (
    <div className="upload-screen">
      <div className="upload-card">
        <div className="upload-logo">
          <span className="logo-icon">₹</span>
          <span className="logo-text">SpendIQ</span>
        </div>
        <h1 className="upload-title">Know where your money goes</h1>
        <p className="upload-sub">Paste your bank SMS messages and get AI-powered spending insights instantly. No account needed.</p>

        <div className="tab-row">
          <button className={`tab-btn ${mode === "paste" ? "active" : ""}`} onClick={() => setMode("paste")}>Paste SMS</button>
          <button className={`tab-btn ${mode === "demo" ? "active" : ""}`} onClick={() => setMode("demo")}>Use demo data</button>
        </div>

        {mode === "paste" ? (
          <>
            <textarea
              className="sms-input"
              placeholder={`Paste your bank debit SMS messages here...\n\nExample:\n${sampleSMS}`}
              value={sms}
              onChange={e => { setSms(e.target.value); setError(""); }}
              rows={8}
            />
            <p className="privacy-note">🔒 Your data never leaves your device. Processed locally.</p>
            {error && <div className="error-msg">{error}</div>}
            <button className="primary-btn" onClick={handlePaste} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Analysing..." : "Analyse my spending →"}
            </button>
          </>
        ) : (
          <div className="demo-box">
            <p className="demo-label">Includes 15 realistic transactions across Amazon, Zomato, Swiggy, Netflix and more.</p>
            <button className="primary-btn" onClick={handleDemo} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "Loading demo..." : "See the demo →"}
            </button>
          </div>
        )}

        <div className="feature-pills">
          <span className="pill">📊 Monthly summary</span>
          <span className="pill">🤖 AI insights</span>
          <span className="pill">💡 Price checker</span>
          <span className="pill">📈 Trends</span>
        </div>
      </div>
    </div>
  );
}
