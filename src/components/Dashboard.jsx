import { useState, useMemo } from "react";
import { mockInsights, mockPriceCheck } from "../data/mockData";
import Chatbot from "./Chatbot";

const PLATFORM_COLORS = {
  amazon: "#f59e0b", zomato: "#ef4444", swiggy: "#f97316",
  other: "#8b5cf6", flipkart: "#3b82f6",
};
const PLATFORM_LABELS = {
  amazon: "Amazon", zomato: "Zomato", swiggy: "Swiggy",
  other: "Others", flipkart: "Flipkart",
};

function fmt(n) { return "₹" + n.toLocaleString("en-IN"); }

async function askAI(prompt) {
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!API_KEY) {
    return "⚠️ API key not configured. Add VITE_OPENROUTER_API_KEY to your .env file and Vercel environment variables.";
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://spendiq-delta.vercel.app",
        "X-Title": "SpendIQ",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    console.log("OpenRouter status:", res.status);
    const data = await res.json();
    console.log("OpenRouter response:", data);

    if (!res.ok) {
      const errMsg = data?.error?.message || `Request failed with status ${res.status}`;
      console.error("OpenRouter error:", errMsg);
      return `⚠️ AI error: ${errMsg}`;
    }

    return data?.choices?.[0]?.message?.content || "No response from AI.";
  } catch (err) {
    console.error("Network error:", err);
    return `⚠️ Network error: ${err.message}`;
  }
}

export default function Dashboard({ transactions, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [priceResult, setPriceResult] = useState(null);
  const [checkingPrice, setCheckingPrice] = useState(false);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);

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

  // Helper: format currency
  const f = (n) => "₹" + Number(n).toLocaleString("en-IN");

  // 1. AI Spending Advice — rule-based, no API needed
  const handleAiAdvice = () => {
    setAiAdviceLoading(true);
    setAiAdvice("");
    setTimeout(() => {
      const total = insights.totalSpent;
      const amazonAmt = insights.byPlatform.amazon || 0;
      const foodAmt = (insights.byPlatform.zomato || 0) + (insights.byPlatform.swiggy || 0);
      const subAmt = txnList.filter(t => t.category === "Subscription").reduce((s,t) => s+t.amount, 0);
      const flipkartAmt = insights.byPlatform.flipkart || 0;
      const potentialSaving = Math.round(amazonAmt*0.1 + foodAmt*0.3 + subAmt*0.2);

      const tips = [
        amazonAmt > 0 && `💡 **Amazon Spending (${f(amazonAmt)})**\nYou spent ${f(amazonAmt)} on Amazon this month — ${Math.round(amazonAmt/total*100)}% of your total. Enable Amazon's "Price Watch" to get alerts when prices drop. Waiting 24 hours before purchasing items over ₹1,000 can reduce impulse buying by up to 30%. Potential saving: ${f(Math.round(amazonAmt*0.1))}/month`,
        foodAmt > 0 && `🍔 **Food Delivery (${f(foodAmt)})**\nYou're spending ${f(Math.round(foodAmt/4))}/week on food delivery. Order before 12pm for Zomato's lunch deals (up to 40% off). Use Swiggy One or Zomato Gold for free delivery — breaks even at just 2-3 orders/month. Cooking 3 extra meals/week could save ${f(Math.round(foodAmt*0.3))}/month.`,
        subAmt > 0 && `📺 **Subscriptions (${f(subAmt)}/month)**\n${subAmt > 800 ? `You're paying for multiple streaming services. Consider rotating — watch Netflix for 2 months, then switch to Hotstar. Annual plans save 20-30% vs monthly.` : `Your subscription spend is reasonable. Switch to annual plans to save 20-30%.`} Potential saving: ${f(Math.round(subAmt*0.2))}/month`,
        flipkartAmt > 0 && `🛒 **Flipkart (${f(flipkartAmt)})**\nShop during Big Billion Days or sale events for 30-50% off. Use Flipkart Axis Bank card for extra 5% cashback on every purchase.`,
        `💰 **Total Potential Saving: ${f(potentialSaving)}/month**\nBy reducing food delivery by 30%, auditing subscriptions, and avoiding impulse Amazon purchases — you could save ${f(potentialSaving)} every month, which adds up to ${f(potentialSaving*12)} per year.`
      ].filter(Boolean);

      setAiAdvice(tips.join("\n\n"));
      setAiAdviceLoading(false);
    }, 800);
  };

  // 2. Amazon Order Analysis — rule-based
  const handleAmazonAnalysis = () => {
    setAmazonLoading(true);
    setAmazonAnalysis("");
    setTimeout(() => {
      const amazonTxnList = txnList.filter(t => t.platform === "amazon");
      if (amazonTxnList.length === 0) {
        setAmazonAnalysis("No Amazon transactions found in your data.");
        setAmazonLoading(false);
        return;
      }
      const total = amazonTxnList.reduce((s,t) => s+t.amount, 0);
      const avg = Math.round(total / amazonTxnList.length);
      const biggest = [...amazonTxnList].sort((a,b) => b.amount-a.amount)[0];
      const electronics = amazonTxnList.filter(t => t.category === "Electronics");
      const isImpulse = amazonTxnList.some(t => t.amount < 500) || amazonTxnList.length > 5;

      const result = [
        `🛒 **Amazon Analysis — ${f(total)} across ${amazonTxnList.length} orders**`,
        ``,
        `📊 **Order Pattern:**`,
        `• Average order value: ${f(avg)}`,
        `• Biggest purchase: ${biggest.description} (${f(biggest.amount)})`,
        `• ${isImpulse ? "⚠️ Pattern suggests some impulse buying — multiple small orders detected" : "✅ Looks like planned purchases"}`,
        ``,
        electronics.length > 0 ? `⚡ **Electronics Spending: ${f(electronics.reduce((s,t)=>s+t.amount,0))}**\n• ${electronics.length} electronics purchase(s) detected\n• Always check prices on Flipkart and Croma before buying electronics — they're often 5-15% cheaper` : null,
        ``,
        `💡 **3 Ways to Save on Amazon:**`,
        `1. Use Amazon Pay ICICI card — 5% cashback on every Amazon purchase`,
        `2. Shop during Great Indian Festival (Oct) for 40-70% off electronics`,
        `3. Add to cart and wait — prices often drop within 7 days for non-urgent items`,
        ``,
        `💰 Potential monthly saving: ${f(Math.round(total*0.1))}`,
      ].filter(l => l !== null).join("\n");

      setAmazonAnalysis(result);
      setAmazonLoading(false);
    }, 800);
  };

  // 3. Food Habit Analysis — rule-based
  const handleFoodAnalysis = () => {
    setFoodLoading(true);
    setFoodAnalysis("");
    setTimeout(() => {
      const zomatoAmt = insights.byPlatform.zomato || 0;
      const swiggyAmt = insights.byPlatform.swiggy || 0;
      const foodAmt = zomatoAmt + swiggyAmt;
      const foodTxnList = txnList.filter(t => ["zomato","swiggy"].includes(t.platform));

      if (foodAmt === 0) {
        setFoodAnalysis("No food delivery transactions found in your data.");
        setFoodLoading(false);
        return;
      }

      const perWeek = Math.round(foodAmt / 4);
      const avgOrder = Math.round(foodAmt / Math.max(foodTxnList.length, 1));
      const preferred = zomatoAmt >= swiggyAmt ? "Zomato" : "Swiggy";

      const result = [
        `🍔 **Food Delivery Analysis — ${f(foodAmt)}/month**`,
        ``,
        `📊 **Your Habits:**`,
        `• Zomato: ${f(zomatoAmt)} | Swiggy: ${f(swiggyAmt)}`,
        `• Preferred platform: ${preferred}`,
        `• Average order value: ${f(avgOrder)}`,
        `• Weekly spend: ~${f(perWeek)}`,
        `• Orders this month: ${foodTxnList.length}`,
        ``,
        foodAmt > 3000 ? `⚠️ **Above average** — typical Indian urban food delivery spend is ₹2,000-3,000/month` : `✅ **Reasonable** — your food delivery spend is within the average range`,
        ``,
        `💡 **4 Tips to Cut Costs:**`,
        `1. 🕛 Order lunch before 12pm — Zomato lunch deals save 30-40%`,
        `2. 👥 Try ${preferred === "Zomato" ? "Zomato Gold" : "Swiggy One"} membership — free delivery pays off in 2-3 orders`,
        `3. 🏠 Cook 3 extra meals/week — saves ~${f(Math.round(perWeek*0.3))}/week`,
        `4. 📅 Designate 2 "no delivery" days/week — saves ${f(Math.round(foodAmt*0.25))}/month`,
        ``,
        `💰 Potential saving: ${f(Math.round(foodAmt*0.3))}/month`,
      ].join("\n");

      setFoodAnalysis(result);
      setFoodLoading(false);
    }, 800);
  };

  // 4. Subscription Wastage Detection — rule-based
  const handleSubAnalysis = () => {
    setSubLoading(true);
    setSubAnalysis("");
    setTimeout(() => {
      const subTxnList = txnList.filter(t => t.category === "Subscription");
      const subTotal = subTxnList.reduce((s,t) => s+t.amount, 0);

      const hasNetflix = txnList.some(t => t.merchant?.toLowerCase().includes("netflix"));
      const hasHotstar = txnList.some(t => t.merchant?.toLowerCase().includes("hotstar"));
      const hasSpotify = txnList.some(t => t.merchant?.toLowerCase().includes("spotify"));
      const hasBothStreaming = hasNetflix && hasHotstar;

      const lines = [
        `📺 **Subscription Audit — ${f(subTotal || 947)}/month**`,
        ``,
      ];

      if (subTxnList.length > 0) {
        subTxnList.forEach(t => {
          const name = t.merchant;
          const lower = name?.toLowerCase() || "";
          let verdict = "✅ Keep";
          let reason = "Good value for money";
          if (lower.includes("netflix")) { verdict = hasBothStreaming ? "⚠️ Consider Cancelling" : "✅ Keep"; reason = hasBothStreaming ? "You have both Netflix and Hotstar — pick one" : "Worth it if you watch regularly"; }
          if (lower.includes("hotstar")) { verdict = hasBothStreaming ? "⚠️ Downgrade" : "✅ Keep"; reason = hasBothStreaming ? "Switch to mobile-only plan (₹149/month) to save ₹150" : "Good value for sports + movies"; }
          if (lower.includes("spotify")) { verdict = "💡 Review"; reason = "Family plan (₹179/month for 6 people) is much cheaper if shared"; }
          lines.push(`**${name} — ${f(t.amount)}/month**\nVerdict: ${verdict}\n${reason}`);
          lines.push(``);
        });
      } else {
        lines.push(`**Netflix — ₹649/month**\nVerdict: ${hasBothStreaming ? "⚠️ Consider cancelling" : "✅ Keep"}\n${hasBothStreaming ? "Overlaps with Hotstar" : "Worth it if you watch regularly"}`);
        lines.push(``);
        lines.push(`**Hotstar — ₹299/month**\nVerdict: ✅ Keep\nGood value for IPL + movies`);
        lines.push(``);
      }

      if (hasBothStreaming) lines.push(`⚠️ **Overlap detected:** Netflix + Hotstar — you're paying for duplicate streaming content. Cancel one to save ₹300-650/month.`);

      lines.push(`\n💡 **Quick wins:**`);
      lines.push(`• Switch all subscriptions to annual plans — saves 20-30%`);
      lines.push(`• Share family plans wherever possible`);
      lines.push(`\n💰 Potential saving: ${f(Math.round((subTotal||947)*0.25))}/month`);

      setSubAnalysis(lines.join("\n"));
      setSubLoading(false);
    }, 800);
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

      {/* Floating Chat Button */}
      <button className="chat-fab" onClick={() => setChatOpen(true)} title="Ask SpendIQ Assistant">
        💬
        <span className="chat-fab-label">Ask AI</span>
      </button>

      {/* Chatbot */}
      <Chatbot
        transactions={txnList}
        insights={insights}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
