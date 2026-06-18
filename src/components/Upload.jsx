import { useState } from "react";
import { mockTransactions, parseSMS } from "../data/mockData";
import StatementUpload from "./StatementUpload";

export default function Upload({ onData }) {
  const [sms, setSms] = useState("");
  const [mode, setMode] = useState("statement"); // "statement" | "sms" | "demo"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onData(mockTransactions); }, 1200);
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

  const sampleSMS = `Rs.4299 debited from your account for Amazon.in on 01-Jun-2026
Rs.720 debited at Zomato UPI on 01-Jun-2026
Rs.2150 spent at Amazon.in on 31-May-2026`;

  if (mode === "statement") {
    return (
      <div className="upload-screen">
        <div className="upload-card" style={{ maxWidth: "580px" }}>
          <StatementUpload onData={onData} />
          <div className="tab-row" style={{ marginTop: "1.5rem" }}>
            <button className="tab-btn" onClick={() => setMode("sms")}>📱 Paste SMS instead</button>
            <button className="tab-btn" onClick={handleDemo}>{loading ? "Loading..." : "🎮 Use demo data"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-screen">
      <div className="upload-card">
        <div className="upload-logo">
          <span className="logo-icon">₹</span>
          <span className="logo-text">SpendIQ</span>
        </div>
        <h1 className="upload-title">Know where your money goes</h1>
        <p className="upload-sub">Paste your bank SMS messages or upload a bank statement to get AI-powered spending insights instantly.</p>

        <div className="tab-row">
          <button className={`tab-btn ${mode === "statement" ? "active" : ""}`} onClick={() => setMode("statement")}>📄 Bank Statement</button>
          <button className={`tab-btn ${mode === "sms" ? "active" : ""}`} onClick={() => setMode("sms")}>📱 Paste SMS</button>
          <button className={`tab-btn ${mode === "demo" ? "active" : ""}`} onClick={() => setMode("demo")}>🎮 Demo</button>
        </div>

        {mode === "sms" && (
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
              {loading ? <><span className="spinner" /> Analysing...</> : "Analyse my spending →"}
            </button>
          </>
        )}

        {mode === "demo" && (
          <div className="demo-box">
            <p className="demo-label">Includes 15 realistic transactions across Amazon, Zomato, Swiggy, Netflix and more.</p>
            <button className="primary-btn" onClick={handleDemo} disabled={loading}>
              {loading ? <><span className="spinner" /> Loading demo...</> : "See the demo →"}
            </button>
          </div>
        )}

        <div className="feature-pills">
          <span className="pill">📊 Monthly summary</span>
          <span className="pill">🤖 AI insights</span>
          <span className="pill">💡 Price checker</span>
          <span className="pill">📄 PDF statements</span>
        </div>
      </div>
    </div>
  );
}
