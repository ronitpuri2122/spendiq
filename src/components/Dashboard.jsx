import { useState, useMemo } from "react";
import { mockInsights, mockPriceCheck } from "../data/mockData";

const GEMINI_KEY = "AIzaSyAQ.Ab8RN6JFhbaFl8Nie9IAqu9P4qF6jhlIdL0BpyUQ8qgyu-WnRA";

const PLATFORM_COLORS = {
  amazon: "#f59e0b", zomato: "#ef4444", swiggy: "#f97316",
  other: "#8b5cf6", flipkart: "#3b82f6",
};
const PLATFORM_LABELS = {
  amazon: "Amazon", zomato: "Zomato", swiggy: "Swiggy",
  other: "Others", flipkart: "Flipkart",
};

function fmt(n) { return "₹" + n.toLocaleString("en-IN"); }

async function askGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not get AI response.";
}

export default function Dashboard({ transactions, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [priceResult, setPriceResult] = useState(null);
  const [checkingPrice, setCheckingPrice] = useState(false);

  // AI states
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [amazonAnalysis, setAmazonAnalysis] = useState("");
  const [amazonLoading, setAmazonLoading] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState("");
  const [foodLoading, setFoodLoading] = useState(false);
  const [subAnalysis, setSubAnalysis] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const txnList = transactions && transactions.length > 0 ? transactions : [
    { id: 1, date: "Jun 01", merchant: "Amazon.in", category: "Electronics", amount: 4299, platform: "amazon", description: "boAt Rockerz 450 Bluetooth Headphones" },
    { id: 2, date: "Jun 01", merchant: "Zomato", category: "Food", amount: 720, platform: "zomato", description: "Burger King order" },
    { id: 3, date: "May 31", merchant: "Amazon.in", category: "Clothing", amount: 2150, platform: "amazon", description: "Campus Men's Running Shoes" },
    { id: 4, date: "May 30", merchant: "Netflix", category: "Subscription", amount: 649, platform: "other", description: "Monthly subscription" },
    { id: 5, date: "May 29", merchant: "Swiggy", category: "Food", amount: 890, platform: "swiggy", description: "Dominos Pizza order" },
    { id: 6, date: "May 28", merchant: "Amazon.in", category: "Groceries", amount: 1840, platform: "amazon", description: "Tata Sampann Dal bundle" },
    { id: 7, date: "May 27", merchant: "Zomato", category: "Food", amount: 540, platform: "zomato", description: "Biryani order" },
    { id: 8, date: "May 26", merchant: "Amazon.in", category: "Electronics", amount: 2911, platform: "amazon", description: "Anker USB-C Hub" },
    { id: 9, date: "May 25", merchant: "Hotstar", category: "Subscription", amount: 299, platform: "other", description: "Monthly subscription" },
    { id: 10, date: "May 24", merchant: "Swiggy", category: "Food", amount: 780, platform: "swiggy", description: "KFC order" },
  ];

  const insights = useMemo(() => {
    const byPlatform = {};
    let total = 0;
    txnList.forEach(t => {
      byPlatform[t.platform] = (byPlatform[t.platform] || 0) + t.amount;
      total += t.amount;
    });
    return { ...mockInsights, totalSpent: total, byPlatform };
  }, [txnList]);

  const platformTotals = Object.entries(insights.byPlatform).sort((a, b) => b[1] - a[1]);
  const maxPlatform = platformTotals[0]?.[1] || 1;

  const txnSummary = txnList.map(t => `${t.merchant} ₹${t.amount} (${t.category})`).join(", ");
  const amazonTxns = txnList.filter(t => t.platform === "amazon").map(t => `${t.description} ₹${t.amount}`).join(", ");
  const foodTxns = txnList.filter(t => ["zomato", "swiggy"].includes(t.platform)).map(t => `${t.merchant}: ${t.description} ₹${t.amount}`).join(", ");
  const subTxns = txnList.filter(t => t.category === "Subscription").map(t => `${t.merchant} ₹${t.amount}`).join(", ");

  // 1. AI Spending Advice
  const handleAiAdvice = async () => {
    setAiAdviceLoading(true);
    setAiAdvice("");
    const prompt = `You are a personal finance advisor for Indian consumers. Analyze these transactions and give 5 specific, actionable money-saving tips in simple English. Be direct, practical, and friendly. Use ₹ for currency. Transactions: ${txnSummary}. Total spend: ₹${insights.totalSpent}. Format each tip with an emoji and bold title.`;
    const result = await askGemini(prompt);
    setAiAdvice(result);
    setAiAdviceLoading(false);
  };

  // 2. Amazon Order Analysis
  const handleAmazonAnalysis = async () => {
    setAmazonLoading(true);
    setAmazonAnalysis("");
    const prompt = `You are an Amazon shopping analyst. Analyze these Amazon purchases made by an Indian consumer and give insights: Are these impulse buys or planned purchases? Which categories are they overspending on? Suggest 3 specific ways to save money on Amazon India (deals, alternatives, timing). Amazon purchases: ${amazonTxns}. Be specific, use ₹, keep it under 200 words, use emojis for each point.`;
    const result = await askGemini(prompt);
    setAmazonAnalysis(result);
    setAmazonLoading(false);
  };

  // 3. Food Habit Analysis
  const handleFoodAnalysis = async () => {
    setFoodLoading(true);
    setFoodAnalysis("");
    const prompt = `You are a food spending coach for Indian consumers. Analyze these food delivery orders and give insights about eating habits and spending. How many times per week are they ordering? What's the average order value? Are there healthier or cheaper alternatives? Food orders: ${foodTxns}. Total food spend: ₹${(insights.byPlatform.zomato || 0) + (insights.byPlatform.swiggy || 0)}. Give 4 specific tips to reduce food delivery costs without sacrificing enjoyment. Use emojis, keep it friendly and under 200 words.`;
    const result = await askGemini(prompt);
    setFoodAnalysis(result);
    setFoodLoading(false);
  };

  // 4. Subscription Wastage Detection
  const handleSubAnalysis = async () => {
    setSubLoading(true);
    setSubAnalysis("");
    const prompt = `You are a subscription audit expert. Analyze these subscriptions for an Indian consumer and detect wastage. Check for: overlapping services (e.g. both Netflix and Hotstar), subscriptions that could be shared, cheaper alternatives, and ones that might not be worth the cost. Subscriptions: ${subTxns || "Netflix ₹649, Hotstar ₹299, Spotify ₹119"}. Monthly subscription total: ₹${insights.byPlatform.other || 947}. Give a verdict on each subscription (Keep / Cancel / Downgrade) with a reason. Use emojis, be direct, under 200 words.`;
    const result = await askGemini(prompt);
    setSubAnalysis(result);
    setSubLoading(false);
  };

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

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">
          <span className="logo-icon small">₹</span>
          <span className="logo-text">SpendIQ</span>
        </div>
        <div className="dash-nav">
          {["overview", "ai-advisor", "transactions", "insights"].map(tab => (
            <button key={tab} className={`nav-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "ai-advisor" ? "🤖 AI Advisor" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <button className="back-btn" onClick={onBack}>+ New analysis</button>
      </header>

      <main className="dash-main">

        {/* OVERVIEW */}
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
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(amt / maxPlatform) * 100}%`, background: PLATFORM_COLORS[platform] || "#6b7280" }} /></div>
                      <div className="bar-amt">{fmt(amt)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-title">6-month trend</div>
                <div className="trend-chart">
                  {mockInsights.monthlyTrend.map((month) => {
                    const total = month.amazon + month.zomato + month.swiggy + month.other;
                    const height = Math.round((total / 30000) * 100);
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
            <div className="ai-promo-banner">
              <div className="ai-promo-left">
                <div className="ai-promo-title">🤖 Get real AI insights on your spending</div>
                <div className="ai-promo-sub">Powered by Gemini — Amazon analysis, food habits, subscription audit & personalised advice</div>
              </div>
              <button className="primary-btn" style={{ maxWidth: "180px", fontSize: "13px", padding: "10px 16px" }} onClick={() => setActiveTab("ai-advisor")}>Open AI Advisor →</button>
            </div>
          </>
        )}

        {/* AI ADVISOR - 4 FEATURES */}
        {activeTab === "ai-advisor" && (
          <div className="ai-advisor-section">
            <div className="section-title">🤖 AI Advisor — powered by Gemini</div>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "1.5rem" }}>Click any button below to get real AI analysis of your spending. Each analysis is generated live.</p>

            <div className="ai-features-grid">

              {/* 1. Spending Advice */}
              <div className="ai-feature-card">
                <div className="ai-feature-header">
                  <span className="ai-feature-icon">💡</span>
                  <div>
                    <div className="ai-feature-title">AI Spending Advice</div>
                    <div className="ai-feature-sub">5 personalised tips to save money based on your actual transactions</div>
                  </div>
                </div>
                <button className="ai-run-btn" onClick={handleAiAdvice} disabled={aiAdviceLoading}>
                  {aiAdviceLoading ? <><span className="spinner" /> Analysing...</> : "Get spending advice →"}
                </button>
                {aiAdvice && <div className="ai-result">{aiAdvice}</div>}
              </div>

              {/* 2. Amazon Analysis */}
              <div className="ai-feature-card">
                <div className="ai-feature-header">
                  <span className="ai-feature-icon">🛒</span>
                  <div>
                    <div className="ai-feature-title">Amazon Order Analysis</div>
                    <div className="ai-feature-sub">Are your Amazon purchases planned or impulse buys? Find out now</div>
                  </div>
                </div>
                <button className="ai-run-btn" onClick={handleAmazonAnalysis} disabled={amazonLoading}>
                  {amazonLoading ? <><span className="spinner" /> Analysing...</> : "Analyse Amazon orders →"}
                </button>
                {amazonAnalysis && <div className="ai-result">{amazonAnalysis}</div>}
              </div>

              {/* 3. Food Habit Analysis */}
              <div className="ai-feature-card">
                <div className="ai-feature-header">
                  <span className="ai-feature-icon">🍔</span>
                  <div>
                    <div className="ai-feature-title">Food Habit Analysis</div>
                    <div className="ai-feature-sub">How much are Zomato & Swiggy really costing you? Get the truth</div>
                  </div>
                </div>
                <button className="ai-run-btn" onClick={handleFoodAnalysis} disabled={foodLoading}>
                  {foodLoading ? <><span className="spinner" /> Analysing...</> : "Analyse food habits →"}
                </button>
                {foodAnalysis && <div className="ai-result">{foodAnalysis}</div>}
              </div>

              {/* 4. Subscription Audit */}
              <div className="ai-feature-card">
                <div className="ai-feature-header">
                  <span className="ai-feature-icon">📺</span>
                  <div>
                    <div className="ai-feature-title">Subscription Wastage Detector</div>
                    <div className="ai-feature-sub">Find overlapping or wasteful subscriptions — Netflix, Hotstar, Spotify & more</div>
                  </div>
                </div>
                <button className="ai-run-btn" onClick={handleSubAnalysis} disabled={subLoading}>
                  {subLoading ? <><span className="spinner" /> Analysing...</> : "Detect wastage →"}
                </button>
                {subAnalysis && <div className="ai-result">{subAnalysis}</div>}
              </div>

            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="txn-section">
            <div className="section-title">All transactions <span className="count-badge">{txnList.length}</span></div>
            <div className="txn-list">
              {txnList.map(txn => (
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

        {/* INSIGHTS */}
        {activeTab === "insights" && (
          <div className="insights-section">
            <div className="section-title">🤖 AI spending summary</div>
            <div className="ai-summary-card">
              <div className="ai-badge">AI · Gemini</div>
              <p className="ai-text">{mockInsights.aiSummary}</p>
            </div>
            <div className="section-title" style={{ marginTop: "1.5rem" }}>Recommendations</div>
            <div className="tips-grid">
              {mockInsights.tips.map((tip, i) => (
                <div className="tip-card" key={i}>
                  <div className="tip-icon">{tip.icon}</div>
                  <div><div className="tip-title">{tip.title}</div><div className="tip-desc">{tip.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRICE CHECK */}
        {activeTab === "pricecheck" && (
          <div className="pricecheck-section">
            <button className="ghost-btn" onClick={() => setActiveTab("transactions")}>← Back to transactions</button>
            <div className="section-title" style={{ marginTop: "1rem" }}>Price check</div>
            {checkingPrice && <div className="loading-card"><div className="spinner large" /><p>Searching current prices...</p></div>}
            {priceResult && selectedTxn && !checkingPrice && (
              <div className="price-card">
                <div className="price-product">{selectedTxn.description}</div>
                <div className="price-row">
                  <div className="price-col"><div className="price-label">You paid</div><div className="price-value">{fmt(priceResult.yourPrice)}</div></div>
                  <div className="price-col"><div className="price-label">Current price</div><div className={`price-value ${priceResult.currentPrice < priceResult.yourPrice ? "green" : ""}`}>{fmt(priceResult.currentPrice)}</div></div>
                  <div className="price-col"><div className="price-label">Lowest (30 days)</div><div className="price-value green">{fmt(priceResult.lowestRecent)}</div></div>
                </div>
                <div className={`verdict-badge ${priceResult.verdict}`}>
                  {priceResult.verdict === "overpaid" ? `⚠ You overpaid by ${fmt(priceResult.saving)}` : "✓ That was a fair price"}
                </div>
                {priceResult.alternatives.length > 0 && (
                  <>{priceResult.alternatives.map((alt, i) => (
                    <div className="alt-row" key={i}><span className="alt-name">{alt.name}</span><span className="alt-rating">★ {alt.rating}</span><span className="alt-price">{fmt(alt.price)}</span></div>
                  ))}</>
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
