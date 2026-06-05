import { useState, useMemo } from "react";
import { mockInsights, mockPriceCheck } from "../data/mockData";

const PLATFORM_COLORS = {
  amazon: "#f59e0b",
  zomato: "#ef4444",
  swiggy: "#f97316",
  other: "#8b5cf6",
  flipkart: "#3b82f6",
};

const PLATFORM_LABELS = {
  amazon: "Amazon",
  zomato: "Zomato",
  swiggy: "Swiggy",
  other: "Others",
  flipkart: "Flipkart",
};

function fmt(n) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function Dashboard({ transactions, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [priceResult, setPriceResult] = useState(null);
  const [checkingPrice, setCheckingPrice] = useState(false);

  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return mockInsights;
    const byPlatform = {};
    let total = 0;
    transactions.forEach(t => {
      byPlatform[t.platform] = (byPlatform[t.platform] || 0) + t.amount;
      total += t.amount;
    });
    return { ...mockInsights, totalSpent: total, byPlatform };
  }, [transactions]);

  const txnList = transactions && transactions.length > 0 ? transactions : [];

  const handlePriceCheck = (txn) => {
    setSelectedTxn(txn);
    setCheckingPrice(true);
    setPriceResult(null);
    setTimeout(() => {
      const result = mockPriceCheck[txn.description] || {
        yourPrice: txn.amount,
        currentPrice: Math.round(txn.amount * (0.85 + Math.random() * 0.25)),
        lowestRecent: Math.round(txn.amount * 0.8),
        verdict: Math.random() > 0.5 ? "fair" : "overpaid",
        saving: Math.round(txn.amount * 0.1),
        alternatives: [],
      };
      setCheckingPrice(false);
      setPriceResult(result);
    }, 1500);
  };

  const platformTotals = Object.entries(insights.byPlatform).sort((a, b) => b[1] - a[1]);
  const maxPlatform = platformTotals[0]?.[1] || 1;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">
          <span className="logo-icon small">₹</span>
          <span className="logo-text">SpendIQ</span>
        </div>
        <div className="dash-nav">
          {["overview", "transactions", "insights"].map(tab => (
            <button key={tab} className={`nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button className="back-btn" onClick={onBack}>+ New analysis</button>
      </header>

      <main className="dash-main">

        {activeTab === "overview" && (
          <>
            <div className="metric-strip">
              <div className="metric-card accent">
                <div className="metric-label">Total spent · June</div>
                <div className="metric-value">{fmt(insights.totalSpent)}</div>
                <div className="metric-sub up">↑ {insights.changePercent}% vs last month</div>
              </div>
              {platformTotals.slice(0, 3).map(([platform, amt]) => (
                <div className="metric-card" key={platform}>
                  <div className="metric-label">{PLATFORM_LABELS[platform] || platform}</div>
                  <div className="metric-value">{fmt(amt)}</div>
                  <div className="metric-sub">{Math.round(amt / insights.totalSpent * 100)}% of total</div>
                </div>
              ))}
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-title">By platform</div>
                <div className="platform-bars">
                  {platformTotals.map(([platform, amt]) => (
                    <div className="bar-row" key={platform}>
                      <div className="bar-label">{PLATFORM_LABELS[platform] || platform}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(amt / maxPlatform) * 100}%`, background: PLATFORM_COLORS[platform] || "#6b7280" }} />
                      </div>
                      <div className="bar-amt">{fmt(amt)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title">6-month trend</div>
                <div className="trend-chart">
                  {mockInsights.monthlyTrend.map((month, i) => {
                    const total = month.amazon + month.zomato + month.swiggy + month.other;
                    const maxTotal = 30000;
                    const height = Math.round((total / maxTotal) * 100);
                    return (
                      <div className="trend-col" key={month.month}>
                        <div className="trend-bar-wrap">
                          <div className="trend-bar" style={{ height: `${height}%` }}>
                            <div className="trend-seg" style={{ height: `${(month.amazon / total) * 100}%`, background: PLATFORM_COLORS.amazon }} />
                            <div className="trend-seg" style={{ height: `${(month.zomato / total) * 100}%`, background: PLATFORM_COLORS.zomato }} />
                            <div className="trend-seg" style={{ height: `${(month.swiggy / total) * 100}%`, background: PLATFORM_COLORS.swiggy }} />
                            <div className="trend-seg" style={{ height: `${(month.other / total) * 100}%`, background: PLATFORM_COLORS.other }} />
                          </div>
                        </div>
                        <div className="trend-label">{month.month}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="legend-row">
                  {Object.entries(PLATFORM_COLORS).filter(([k]) => k !== "flipkart").map(([k, c]) => (
                    <span key={k} className="legend-item"><span className="legend-dot" style={{ background: c }} />{PLATFORM_LABELS[k]}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="tips-section">
              <div className="section-title">💡 AI tips</div>
              <div className="tips-grid">
                {mockInsights.tips.map((tip, i) => (
                  <div className="tip-card" key={i}>
                    <div className="tip-icon">{tip.icon}</div>
                    <div>
                      <div className="tip-title">{tip.title}</div>
                      <div className="tip-desc">{tip.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "transactions" && (
          <div className="txn-section">
            <div className="section-title">All transactions <span className="count-badge">{txnList.length || mockInsights.monthlyTrend.length * 2}</span></div>
            <div className="txn-list">
              {(txnList.length > 0 ? txnList : [
                { id: 1, date: "Jun 01", merchant: "Amazon.in", category: "Electronics", amount: 4299, platform: "amazon", description: "boAt Rockerz 450 Bluetooth Headphones" },
                { id: 2, date: "Jun 01", merchant: "Zomato", category: "Food", amount: 720, platform: "zomato", description: "Burger King order" },
                { id: 3, date: "May 31", merchant: "Amazon.in", category: "Clothing", amount: 2150, platform: "amazon", description: "Campus Men's Running Shoes" },
                { id: 4, date: "May 30", merchant: "Netflix", category: "Subscription", amount: 649, platform: "other", description: "Monthly subscription" },
                { id: 5, date: "May 29", merchant: "Swiggy", category: "Food", amount: 890, platform: "swiggy", description: "Dominos Pizza order" },
              ]).map(txn => (
                <div className="txn-row" key={txn.id}>
                  <div className="txn-dot" style={{ background: PLATFORM_COLORS[txn.platform] || "#6b7280" }} />
                  <div className="txn-info">
                    <div className="txn-merchant">{txn.merchant}</div>
                    <div className="txn-desc">{txn.description}</div>
                  </div>
                  <div className="txn-right">
                    <div className="txn-amt">{fmt(txn.amount)}</div>
                    {txn.platform === "amazon" && (
                      <button className="price-btn" onClick={() => { setActiveTab("pricecheck"); handlePriceCheck(txn); }}>Price check ↗</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="insights-section">
            <div className="section-title">🤖 AI spending summary</div>
            <div className="ai-summary-card">
              <div className="ai-badge">AI · Claude</div>
              <p className="ai-text">{mockInsights.aiSummary}</p>
            </div>
            <div className="section-title" style={{ marginTop: "1.5rem" }}>Recommendations</div>
            <div className="tips-grid">
              {mockInsights.tips.map((tip, i) => (
                <div className="tip-card" key={i}>
                  <div className="tip-icon">{tip.icon}</div>
                  <div>
                    <div className="tip-title">{tip.title}</div>
                    <div className="tip-desc">{tip.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pricecheck" && (
          <div className="pricecheck-section">
            <button className="ghost-btn" onClick={() => setActiveTab("transactions")}>← Back to transactions</button>
            <div className="section-title" style={{ marginTop: "1rem" }}>Price check</div>
            {checkingPrice && (
              <div className="loading-card">
                <div className="spinner large" />
                <p>Searching current prices online...</p>
              </div>
            )}
            {priceResult && selectedTxn && !checkingPrice && (
              <div className="price-card">
                <div className="price-product">{selectedTxn.description}</div>
                <div className="price-row">
                  <div className="price-col">
                    <div className="price-label">You paid</div>
                    <div className="price-value">{fmt(priceResult.yourPrice)}</div>
                  </div>
                  <div className="price-col">
                    <div className="price-label">Current price</div>
                    <div className={`price-value ${priceResult.currentPrice < priceResult.yourPrice ? "green" : ""}`}>{fmt(priceResult.currentPrice)}</div>
                  </div>
                  <div className="price-col">
                    <div className="price-label">Lowest (30 days)</div>
                    <div className="price-value green">{fmt(priceResult.lowestRecent)}</div>
                  </div>
                </div>
                <div className={`verdict-badge ${priceResult.verdict}`}>
                  {priceResult.verdict === "overpaid" ? `⚠ You overpaid by ${fmt(priceResult.saving)}` : "✓ That was a fair price"}
                </div>
                {priceResult.alternatives.length > 0 && (
                  <>
                    <div className="price-label" style={{ marginTop: "1.25rem", marginBottom: "0.5rem" }}>Cheaper alternatives</div>
                    {priceResult.alternatives.map((alt, i) => (
                      <div className="alt-row" key={i}>
                        <span className="alt-name">{alt.name}</span>
                        <span className="alt-rating">★ {alt.rating}</span>
                        <span className="alt-price">{fmt(alt.price)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            {!checkingPrice && !priceResult && (
              <div className="empty-state">
                <p>Go to Transactions and click "Price check" on an Amazon purchase.</p>
                <button className="primary-btn" style={{ marginTop: "1rem", maxWidth: "200px" }} onClick={() => setActiveTab("transactions")}>View transactions</button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
