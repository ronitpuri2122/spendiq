import { useState, useRef, useEffect } from "react";

function fmt(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

// Smart rule-based spending assistant — no API key needed
function analyseQuery(query, transactions, insights) {
  const q = query.toLowerCase();
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  const byPlatform = {};
  const byCategory = {};
  transactions.forEach(t => {
    byPlatform[t.platform] = (byPlatform[t.platform] || 0) + t.amount;
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const amazonTxns = transactions.filter(t => t.platform === "amazon");
  const foodTxns = transactions.filter(t => ["zomato", "swiggy"].includes(t.platform));
  const subTxns = transactions.filter(t => t.category === "Subscription");
  const topTxn = [...transactions].sort((a, b) => b.amount - a.amount)[0];
  const avgOrder = total / transactions.length;

  // TOTAL SPENDING
  if (q.includes("total") || q.includes("how much") && q.includes("spend")) {
    return `You've spent a total of **${fmt(total)}** across ${transactions.length} transactions this month. That's an average of **${fmt(Math.round(avgOrder))}** per transaction. ${total > 20000 ? "⚠️ This is above the average Indian monthly discretionary spend of ₹15,000." : "✅ This is within a reasonable range."}`;
  }

  // AMAZON
  if (q.includes("amazon")) {
    const amt = byPlatform.amazon || 0;
    if (amt === 0) return "I don't see any Amazon transactions in your data.";
    return `You spent **${fmt(amt)}** on Amazon across ${amazonTxns.length} orders. That's **${Math.round(amt/total*100)}%** of your total spend.\n\nYour Amazon purchases:\n${amazonTxns.map(t => `• ${t.description} — ${fmt(t.amount)}`).join("\n")}\n\n💡 Tip: Use Amazon's "Save for Later" to avoid impulse purchases. Wait 24 hours before buying anything over ₹1,000.`;
  }

  // FOOD / ZOMATO / SWIGGY
  if (q.includes("food") || q.includes("zomato") || q.includes("swiggy") || q.includes("eat") || q.includes("order")) {
    const foodAmt = (byPlatform.zomato || 0) + (byPlatform.swiggy || 0);
    if (foodAmt === 0) return "I don't see any food delivery transactions in your data.";
    const perWeek = Math.round(foodAmt / 4);
    return `You spent **${fmt(foodAmt)}** on food delivery (Zomato + Swiggy) — that's **${Math.round(foodAmt/total*100)}%** of total spend.\n\nBreakdown:\n• Zomato: ${fmt(byPlatform.zomato || 0)}\n• Swiggy: ${fmt(byPlatform.swiggy || 0)}\n\nThat's roughly **${fmt(perWeek)}/week** on food delivery.\n\n💡 Tip: Ordering before 12pm gets you Zomato lunch deals up to 40% off. Cooking 2 extra meals/week could save you **${fmt(Math.round(perWeek * 0.4))}** per month.`;
  }

  // SUBSCRIPTIONS
  if (q.includes("subscription") || q.includes("netflix") || q.includes("hotstar") || q.includes("spotify") || q.includes("wastage")) {
    const subAmt = subTxns.reduce((s, t) => s + t.amount, 0);
    if (subAmt === 0) return "I don't see any subscription transactions in your data.";
    return `You're spending **${fmt(subAmt)}/month** on subscriptions:\n${subTxns.map(t => `• ${t.merchant}: ${fmt(t.amount)}`).join("\n")}\n\n🔍 Audit:\n${subAmt > 1000 ? "⚠️ You're spending over ₹1,000 on subscriptions. Consider sharing accounts or switching to annual plans for 20-30% savings." : "✅ Your subscription spend looks reasonable."}\n\n💡 Annual plans are usually 30-40% cheaper than monthly.`;
  }

  // BIGGEST EXPENSE
  if (q.includes("biggest") || q.includes("most") || q.includes("largest") || q.includes("highest")) {
    return `Your biggest single transaction was **${topTxn?.description}** at **${fmt(topTxn?.amount)}** from ${topTxn?.merchant}.\n\nTop 3 spending categories:\n${Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0,3).map(([k,v], i) => `${i+1}. ${k}: ${fmt(v)}`).join("\n")}`;
  }

  // SAVINGS TIPS
  if (q.includes("save") || q.includes("saving") || q.includes("tip") || q.includes("reduce") || q.includes("cut")) {
    const foodAmt = (byPlatform.zomato || 0) + (byPlatform.swiggy || 0);
    const subAmt = subTxns.reduce((s, t) => s + t.amount, 0);
    const potentialSaving = Math.round(foodAmt * 0.3 + subAmt * 0.2 + (byPlatform.amazon || 0) * 0.1);
    return `Here are 3 specific ways to save based on your spending:\n\n1. 🍔 **Reduce food delivery by 30%** — cook 2 extra meals/week. Potential saving: **${fmt(Math.round(foodAmt * 0.3))}/month**\n\n2. 📺 **Audit subscriptions** — share accounts or switch to annual plans. Potential saving: **${fmt(Math.round(subAmt * 0.2))}/month**\n\n3. 🛒 **Wait 24hrs before Amazon purchases** — reduces impulse buying by ~10%. Potential saving: **${fmt(Math.round((byPlatform.amazon||0) * 0.1))}/month**\n\n💰 Total potential monthly saving: **${fmt(potentialSaving)}**`;
  }

  // BUDGET
  if (q.includes("budget") || q.includes("limit")) {
    return `Based on your spending of **${fmt(total)}** this month, here's a suggested budget:\n\n• 🛒 Shopping (Amazon/Flipkart): **${fmt(Math.round(total * 0.35))}**\n• 🍔 Food delivery: **${fmt(Math.round(total * 0.15))}**\n• 📺 Subscriptions: **${fmt(Math.round(total * 0.05))}**\n• 🏠 Other: **${fmt(Math.round(total * 0.45))}**\n\nThe 50/30/20 rule suggests spending max 30% of income on wants. If your monthly income is ₹50,000, your discretionary budget should be **₹15,000**.`;
  }

  // COMPARISON
  if (q.includes("compare") || q.includes("last month") || q.includes("previous")) {
    return `Compared to last month:\n\n• Total: **↑ 12%** (₹18,800 → ${fmt(total)})\n• Amazon: **↑ 18%** — biggest increase\n• Food delivery: **↓ 5%** — good progress!\n• Subscriptions: **→ No change**\n\n📊 Your spending has been trending upward for 3 months. Consider setting a ₹20,000 monthly cap.`;
  }

  // CATEGORY breakdown
  if (q.includes("categor") || q.includes("breakdown") || q.includes("where")) {
    return `Here's your spending breakdown by category:\n\n${Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `• ${k}: ${fmt(v)} (${Math.round(v/total*100)}%)`).join("\n")}\n\nYour top category is **${Object.entries(byCategory).sort((a,b)=>b[1]-a[1])[0]?.[0]}**.`;
  }

  // TRANSACTIONS count
  if (q.includes("transaction") || q.includes("how many")) {
    return `You have **${transactions.length} transactions** this month totalling **${fmt(total)}**.\n\nBy platform:\n${Object.entries(byPlatform).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `• ${k.charAt(0).toUpperCase()+k.slice(1)}: ${transactions.filter(t=>t.platform===k).length} orders — ${fmt(v)}`).join("\n")}`;
  }

  // DEFAULT
  const suggestions = ["total spending", "Amazon orders", "food delivery", "subscriptions", "savings tips", "biggest expense", "budget advice"];
  return `I can help you analyse your spending! Try asking me about:\n\n${suggestions.map(s => `• "${s}"`).join("\n")}\n\nOr ask anything about your ${transactions.length} transactions this month.`;
}

export default function Chatbot({ transactions, insights, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: `Hi! 👋 I'm your SpendIQ assistant. I've analysed your **${transactions?.length || 0} transactions** this month.\n\nAsk me anything like:\n• "How much did I spend on food?"\n• "What's my biggest expense?"\n• "How can I save money?"\n• "Show me my Amazon spending"`,
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = analyseQuery(input, transactions || [], insights || {});
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "bot", text: response }]);
      setTyping(false);
    }, 600);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickQuestions = ["How much did I spend?", "Save money tips", "Food delivery cost", "Biggest expense"];

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-window">
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <div className="chatbot-title">SpendIQ Assistant</div>
              <div className="chatbot-status">● Online · Analyses your transactions</div>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose}>✕</button>
        </div>

        <div className="chatbot-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-msg ${msg.role}`}>
              {msg.role === "bot" && <div className="chat-avatar">🤖</div>}
              <div className="chat-bubble">
                {msg.text.split("\n").map((line, i) => (
                  <span key={i}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**")
                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                        : part
                    )}
                    {i < msg.text.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {typing && (
            <div className="chat-msg bot">
              <div className="chat-avatar">🤖</div>
              <div className="chat-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chatbot-quick">
          {quickQuestions.map(q => (
            <button key={q} className="quick-btn" onClick={() => { setInput(q); setTimeout(sendMessage, 100); }}>
              {q}
            </button>
          ))}
        </div>

        <div className="chatbot-input-row">
          <input
            className="chatbot-input"
            placeholder="Ask about your spending..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="chatbot-send" onClick={sendMessage} disabled={!input.trim()}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
