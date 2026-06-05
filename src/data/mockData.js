export const mockTransactions = [
  { id: 1, date: "2026-06-01", merchant: "Amazon.in", category: "Electronics", amount: 4299, platform: "amazon", description: "boAt Rockerz 450 Bluetooth Headphones" },
  { id: 2, date: "2026-06-01", merchant: "Zomato", category: "Food", amount: 720, platform: "zomato", description: "Burger King order" },
  { id: 3, date: "2026-05-31", merchant: "Amazon.in", category: "Clothing", amount: 2150, platform: "amazon", description: "Campus Men's Running Shoes" },
  { id: 4, date: "2026-05-30", merchant: "Netflix", category: "Subscription", amount: 649, platform: "other", description: "Monthly subscription" },
  { id: 5, date: "2026-05-29", merchant: "Swiggy", category: "Food", amount: 890, platform: "swiggy", description: "Dominos Pizza order" },
  { id: 6, date: "2026-05-28", merchant: "Amazon.in", category: "Groceries", amount: 1840, platform: "amazon", description: "Tata Sampann Dal, spices bundle" },
  { id: 7, date: "2026-05-27", merchant: "Zomato", category: "Food", amount: 540, platform: "zomato", description: "Biryani order" },
  { id: 8, date: "2026-05-26", merchant: "Amazon.in", category: "Electronics", amount: 2911, platform: "amazon", description: "Anker USB-C Hub" },
  { id: 9, date: "2026-05-25", merchant: "Swiggy", category: "Food", amount: 430, platform: "swiggy", description: "McDonald's order" },
  { id: 10, date: "2026-05-24", merchant: "Amazon.in", category: "Books", amount: 499, platform: "amazon", description: "Atomic Habits - James Clear" },
  { id: 11, date: "2026-05-22", merchant: "Zomato", category: "Food", amount: 1200, platform: "zomato", description: "Weekend family dinner" },
  { id: 12, date: "2026-05-20", merchant: "Hotstar", category: "Subscription", amount: 299, platform: "other", description: "Monthly subscription" },
  { id: 13, date: "2026-05-18", merchant: "Swiggy", category: "Food", amount: 780, platform: "swiggy", description: "KFC order" },
  { id: 14, date: "2026-05-15", merchant: "Amazon.in", category: "Home", amount: 1850, platform: "amazon", description: "Prestige Iron Box" },
  { id: 15, date: "2026-05-10", merchant: "PhonePe", category: "Transfer", amount: 2000, platform: "other", description: "UPI transfer" },
];

export const mockInsights = {
  totalSpent: 21057,
  previousMonth: 18800,
  changePercent: 12,
  byPlatform: {
    amazon: 13549,
    zomato: 2460,
    swiggy: 2100,
    other: 2948,
  },
  monthlyTrend: [
    { month: "Jan", amazon: 7200, zomato: 3200, swiggy: 1800, other: 5800 },
    { month: "Feb", amazon: 9100, zomato: 4100, swiggy: 2200, other: 5500 },
    { month: "Mar", amazon: 8400, zomato: 3800, swiggy: 1900, other: 4900 },
    { month: "Apr", amazon: 9800, zomato: 4200, swiggy: 2500, other: 5600 },
    { month: "May", amazon: 11200, zomato: 4580, swiggy: 2900, other: 6200 },
    { month: "Jun", amazon: 13549, zomato: 2460, swiggy: 2100, other: 2948 },
  ],
  aiSummary: `You spent ₹21,057 this month — ₹2,257 more than last month. Your biggest jump is Amazon, which is up 21% and now makes up 64% of all spending. Electronics alone account for ₹7,210 — worth checking if these were planned purchases.

The good news: your food delivery spending dropped. Zomato is down 46% compared to last month, and Swiggy is also lower. You're saving about ₹2,000/month compared to your peak food-delivery months.

Watch out: at this rate you'll hit ₹25,000+ next month if Amazon spending continues. Consider setting a ₹10,000 cap for online shopping.`,
  tips: [
    { icon: "🛒", title: "Amazon overspend alert", desc: "₹13,549 on Amazon this month — 3 of your 5 electronics purchases had cheaper alternatives on Flipkart or offline stores." },
    { icon: "🍔", title: "Food delivery improving", desc: "You've cut food delivery spend by 30% vs peak. Keep ordering before 12pm for Zomato's lunch deals (up to 40% off)." },
    { icon: "📺", title: "Subscription audit due", desc: "You're paying for Netflix (₹649) + Hotstar (₹299) = ₹948/month. Consider pausing one — you can always reactivate." },
  ],
};

export const mockPriceCheck = {
  "boAt Rockerz 450 Bluetooth Headphones": {
    yourPrice: 4299,
    currentPrice: 3799,
    lowestRecent: 3499,
    verdict: "overpaid",
    saving: 500,
    alternatives: [
      { name: "Noise Shots X5 Pro", price: 2999, rating: 4.1 },
      { name: "JBL Tune 510BT", price: 3499, rating: 4.3 },
    ],
  },
  "Campus Men's Running Shoes": {
    yourPrice: 2150,
    currentPrice: 2150,
    lowestRecent: 1899,
    verdict: "fair",
    saving: 0,
    alternatives: [
      { name: "Asian Men's Running Shoes", price: 799, rating: 3.9 },
      { name: "Sparx Men's Running Shoes", price: 1299, rating: 4.0 },
    ],
  },
};

export const parseSMS = (smsText) => {
  const lines = smsText.split("\n").filter(l => l.trim());
  const transactions = [];

  const patterns = [
    { regex: /(?:debited|spent|paid|deducted)[^\d]*(?:rs\.?|inr|₹)\s*([\d,]+)/i, type: "debit" },
    { regex: /(?:rs\.?|inr|₹)\s*([\d,]+)[^\d]*(?:debited|spent|paid|deducted)/i, type: "debit" },
    { regex: /([\d,]+)[^\d]*(?:debited|deducted)/i, type: "debit" },
  ];

  const merchantPatterns = [
    /(?:at|to|for|from)\s+([A-Z][A-Za-z0-9\s\.]+?)(?:\s+on|\s+ref|\s+upi|\.|\,|$)/i,
    /(?:VPA|UPI)\s+([A-Za-z0-9@\.]+)/i,
  ];

  lines.forEach((line, i) => {
    let amount = null;
    for (const p of patterns) {
      const m = line.match(p.regex);
      if (m) { amount = parseFloat(m[1].replace(/,/g, "")); break; }
    }
    if (!amount) return;

    let merchant = "Unknown";
    for (const p of merchantPatterns) {
      const m = line.match(p);
      if (m) { merchant = m[1].trim(); break; }
    }

    let platform = "other";
    const lower = line.toLowerCase();
    if (lower.includes("amazon")) platform = "amazon";
    else if (lower.includes("zomato")) platform = "zomato";
    else if (lower.includes("swiggy")) platform = "swiggy";
    else if (lower.includes("flipkart")) platform = "flipkart";

    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];

    transactions.push({ id: Date.now() + i, date, merchant, category: "Uncategorised", amount, platform, description: line.substring(0, 60) });
  });

  return transactions;
};
