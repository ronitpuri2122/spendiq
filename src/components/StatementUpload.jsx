import { useState, useRef } from "react";

// Keywords that indicate NON-spending transactions to exclude
const NON_SPENDING_KEYWORDS = [
  "fd through", "principal auto redeem", "quarterly interest",
  "credit interest", "ib fd premat", "loan return", "cheque transitory",
  "salary", "opening balance", "closing balance", "rev-upi",
  "self transfer", "own account"
];
 
// Keywords that are definitely spending
const PLATFORM_MAP = {
  amazon: { platform: "amazon", merchant: "Amazon.in", category: "Shopping" },
  flipkart: { platform: "flipkart", merchant: "Flipkart", category: "Shopping" },
  meesho: { platform: "other", merchant: "Meesho", category: "Shopping" },
  myntra: { platform: "other", merchant: "Myntra", category: "Shopping" },
  ajio: { platform: "other", merchant: "AJIO", category: "Shopping" },
  zomato: { platform: "zomato", merchant: "Zomato", category: "Food" },
  swiggy: { platform: "swiggy", merchant: "Swiggy", category: "Food" },
  blinkit: { platform: "other", merchant: "Blinkit", category: "Groceries" },
  bigbasket: { platform: "other", merchant: "BigBasket", category: "Groceries" },
  netflix: { platform: "other", merchant: "Netflix", category: "Subscription" },
  hotstar: { platform: "other", merchant: "Hotstar", category: "Subscription" },
  disney: { platform: "other", merchant: "Hotstar", category: "Subscription" },
  spotify: { platform: "other", merchant: "Spotify", category: "Subscription" },
  youtube: { platform: "other", merchant: "YouTube Premium", category: "Subscription" },
  irctc: { platform: "other", merchant: "IRCTC", category: "Travel" },
  "make my trip": { platform: "other", merchant: "MakeMyTrip", category: "Travel" },
  uber: { platform: "other", merchant: "Uber", category: "Travel" },
  ola: { platform: "other", merchant: "Ola", category: "Travel" },
  rapido: { platform: "other", merchant: "Rapido", category: "Travel" },
  phonepe: { platform: "other", merchant: "PhonePe", category: "UPI" },
  paytm: { platform: "other", merchant: "Paytm", category: "UPI" },
  "google india": { platform: "other", merchant: "Google Pay", category: "UPI" },
  gpay: { platform: "other", merchant: "Google Pay", category: "UPI" },
  "add money to wallet": { platform: "other", merchant: "Wallet Recharge", category: "Wallet" },
  "credit card": { platform: "other", merchant: "Credit Card Bill", category: "Credit Card" },
  "rbl bank": { platform: "other", merchant: "RBL Credit Card", category: "Credit Card" },
  "national testing": { platform: "other", merchant: "NTA (Exam Fee)", category: "Education" },
  lic: { platform: "other", merchant: "LIC Insurance", category: "Insurance" },
  "redcliffe": { platform: "other", merchant: "Redcliffe Labs", category: "Healthcare" },
  "euronet": { platform: "other", merchant: "Broadband Bill", category: "Bills" },
  atm: { platform: "other", merchant: "ATM Withdrawal", category: "Cash" },
  neft: { platform: "other", merchant: "NEFT Transfer", category: "Transfer" },
  imps: { platform: "other", merchant: "IMPS Transfer", category: "Transfer" },
  petrol: { platform: "other", merchant: "Petrol", category: "Fuel" },
  "water pipe": { platform: "other", merchant: "Hardware Store", category: "Home" },
  "ice cream": { platform: "other", merchant: "Food & Snacks", category: "Food" },
  physiotherapy: { platform: "other", merchant: "Healthcare", category: "Healthcare" },
  sonography: { platform: "other", merchant: "Medical Test", category: "Healthcare" },
  "blood report": { platform: "other", merchant: "Medical Test", category: "Healthcare" },
  "hair cutting": { platform: "other", merchant: "Salon", category: "Personal Care" },
  "news paper": { platform: "other", merchant: "Newspaper", category: "Others" },
};

function isNonSpending(narration) {
  const lower = narration.toLowerCase();
  return NON_SPENDING_KEYWORDS.some(k => lower.includes(k));
}
function detectCategory(narration) {
  const text = narration.toLowerCase();
  if (text.includes("petrol"))
  return { category: "Fuel", platform: "fuel" };

if (text.includes("blanket"))
  return { category: "Shopping", platform: "shopping" };

if (text.includes("news paper"))
  return { category: "Bills", platform: "bills" };

if (text.includes("wallet"))
  return { category: "Wallet", platform: "wallet" };

if (text.includes("credit card"))
  return { category: "Credit Card", platform: "card" };

  if (text.includes("irctc"))
    return { category: "Travel", platform: "travel" };

  if (text.includes("meesho"))
    return { category: "Shopping", platform: "shopping" };

  if (text.includes("amazon"))
    return { category: "Shopping", platform: "amazon" };

  if (text.includes("flipkart"))
    return { category: "Shopping", platform: "flipkart" };

  if (text.includes("zomato"))
    return { category: "Food", platform: "zomato" };

  if (text.includes("swiggy"))
    return { category: "Food", platform: "swiggy" };

  if (text.includes("petrol") || text.includes("fuel"))
    return { category: "Fuel", platform: "fuel" };

  if (text.includes("lic"))
    return { category: "Insurance", platform: "insurance" };

  if (text.includes("google india"))
    return { category: "Bills", platform: "bills" };

  if (text.includes("credit card"))
    return { category: "Credit Card", platform: "card" };

  return { category: "UPI", platform: "upi" };
}

function detectMerchant(narration) {
  const lower = narration.toLowerCase();
  if (lower.includes("irctc"))
  return {
    merchant: "IRCTC",
    category: "Travel",
    platform: "other"
  };

if (lower.includes("meesho"))
  return {
    merchant: "Meesho",
    category: "Shopping",
    platform: "other"
  };

// Extract actual merchant name from UPI transactions


if (lower.includes("google india"))
  return {
    merchant: "Google Pay",
    category: "Bills",
    platform: "other"
  };

  // Extract UPI merchant name from HDFC narration format:
  // "UPI-MERCHANT NAME-upiid@bank-REFNO-PURPOSE"
  const upiMatch = narration.match(/^UPI-([A-Z][^-]{2,}?)-[A-Z0-9@.]+[@-]/i);
  if (upiMatch) {
    const rawName = upiMatch[1].trim();
    const rawLower = rawName.toLowerCase();

    // Check against platform map first
    for (const [key, val] of Object.entries(PLATFORM_MAP)) {
      if (rawLower.includes(key) || lower.includes(key)) return val;
    }

    // Title case the merchant name
    const cleanName = rawName
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/[^A-Za-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 30);

   let category = "Transfer";
let platform = "other";

if (lower.includes("irctc")) {
  category = "Travel";
  platform = "travel";
}
else if (lower.includes("meesho")) {
  category = "Shopping";
  platform = "shopping";
}
else if (lower.includes("google")) {
  category = "Bills";
  platform = "bills";
}
else if (lower.includes("petrol")) {
  category = "Fuel";
  platform = "fuel";
}

return {
  platform,
  merchant: cleanName || "UPI Payment",
  category
};
  }

  // Check known keywords for non-UPI transactions
  for (const [key, val] of Object.entries(PLATFORM_MAP)) {
    if (lower.includes(key)) return val;
  }

  return { platform: "other", merchant: narration.substring(0, 30), category: "Others" };
}

// HDFC PDF has a very specific text layout when extracted:
// Each transaction appears as multiple text chunks we need to reassemble
// Format: Date | Narration (multi-line) | Ref No | Value Date | Withdrawal | Deposit | Balance
function parseHDFCPDF(rawText) {
  const transactions = [];

  const lines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const transactionPattern =
    /^(\d{2}\/\d{2}\/\d{4}).*?([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

  let lastNarration = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Store narration line
    if (
      line.startsWith("UPI-") ||
      line.startsWith("ATM-") ||
      line.startsWith("NEFT-") ||
      line.startsWith("IMPS-")
    ) {
      lastNarration = line;
      continue;
    }

    const match = line.match(transactionPattern);

    if (!match) continue;

    const date = match[1];
    const withdrawal = parseFloat(match[2].replace(/,/g, ""));
    const deposit = parseFloat(match[3].replace(/,/g, ""));
    const balance = parseFloat(match[4].replace(/,/g, ""));

    if (withdrawal <= 0) continue;

    let narration = lastNarration;
    // Capture continuation line after transaction row
const nextLine = lines[i + 1];

if (
  nextLine &&
  !nextLine.startsWith("UPI-") &&
  !nextLine.match(/^\d{2}\/\d{2}\/\d{4}/)
) {
  narration += " " + nextLine;
}

    const merchantData = detectMerchant(narration);
const categoryData = detectCategory(narration);

const merchant = merchantData.merchant;
const category = categoryData.category;
const platform = categoryData.platform;

    transactions.push({
      id: Date.now() + transactions.length,
      date,
      merchant,
      category,
      platform,
      amount: withdrawal,
      balance,
      description: narration,
      type: "debit",
    });
  }

  return transactions;
}

// Generic bank PDF parser (fallback)
function parseGenericPDF(rawText) {
  const transactions = [];
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const datePattern = /\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/;
  const amountPattern = /[\d,]+\.\d{2}/g;
  const debitKeywords = ["dr", "debit", "withdrawal", "paid", "purchase"];

  lines.forEach((line, idx) => {
    if (!datePattern.test(line)) return;
    const lower = line.toLowerCase();
    const isDebit = debitKeywords.some(k => lower.includes(k)) ||
                    (!lower.includes("cr") && !lower.includes("credit") && !lower.includes("deposit"));
    if (!isDebit) return;

    const amounts = [...line.matchAll(amountPattern)].map(m => parseFloat(m[0].replace(/,/g, "")));
    const amount = amounts.find(a => a > 0 && a < 5000000);
    if (!amount) return;

    const { platform, merchant, category } = detectMerchant(line);
    transactions.push({
      id: Date.now() + idx,
      date: line.match(datePattern)?.[0] || "",
      merchant, category, amount, platform,
      description: line.substring(0, 70),
      type: "debit",
    });
  });

  return transactions;
}

// CSV parser with HDFC column detection
function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  const transactions = [];
  const isHDFC = text.toLowerCase().includes("narration") || text.toLowerCase().includes("withdrawal amt");

  lines.forEach((line, i) => {
    if (i === 0) return;
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 4) return;

    let date, description, amount;

    if (isHDFC) {
      // HDFC CSV: Date, Narration, Chq/Ref No., Value Date, Withdrawal Amt., Deposit Amt., Closing Balance
      date = cols[0];
      description = cols[1];
      amount = parseFloat((cols[4] || "0").replace(/,/g, ""));
    } else {
      date = cols[0];
      description = cols[1] || cols[2] || "";
      const numCols = cols.map(c => parseFloat(c.replace(/,/g, ""))).filter(n => !isNaN(n) && n > 0);
      amount = numCols[0] || 0;
    }

    if (!amount || amount <= 0 || !description) return;
    const { platform, merchant, category } = detectMerchant(description);
    transactions.push({ id: Date.now() + i, date, merchant, category, amount, platform, description: description.substring(0, 70), type: "debit" });
  });

  return transactions;
}

async function loadPDFJS() {
  if (window.pdfjsLib) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Failed to load PDF reader"));
    document.head.appendChild(script);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function extractPDFText(file, setProgress) {
  await loadPDFJS();
  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (e) {
    if (e.message?.includes("password")) throw new Error("PDF_PASSWORD");
    throw new Error("Cannot read PDF: " + e.message);
  }

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    setProgress(`Reading page ${p} of ${pdf.numPages}...`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Sort by Y (top to bottom), then X (left to right)
    const items = content.items
      .filter(item => item.str.trim().length > 0)
      .sort((a, b) => {
        const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
        if (Math.abs(yDiff) > 3) return yDiff;
        return a.transform[4] - b.transform[4];
      });

    // Group into lines by Y coordinate
    let lastY = null;
    let currentLine = [];
    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        fullText += currentLine.join(" ") + "\n";
        currentLine = [];
      }
      currentLine.push(item.str.trim());
      lastY = y;
    }
    if (currentLine.length) fullText += currentLine.join(" ") + "\n";
  }
  return fullText;
}

export default function StatementUpload({ onData }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [bank, setBank] = useState("hdfc");
  const fileRef = useRef();

  const processFile = async (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const isPDF = name.endsWith(".pdf");
    const isCSV = name.endsWith(".csv") || name.endsWith(".xls") || name.endsWith(".xlsx");

    if (!isPDF && !isCSV) { setError("Please upload a PDF or CSV/Excel file."); return; }

    setProcessing(true);
    setError("");
    setProgress("Reading your statement...");

    try {
      let transactions = [];

      if (isPDF) {
        const rawText = await extractPDFText(file, setProgress);
        console.log("PDF TEXT START");
console.log(rawText);
console.log("PDF TEXT END");
        setProgress("Detecting transactions...");
        transactions = bank === "hdfc" ? parseHDFCPDF(rawText) : parseGenericPDF(rawText);

        // If HDFC parser found nothing, try generic
        if (transactions.length === 0 && bank === "hdfc") {
          transactions = parseGenericPDF(rawText);
        }
      } else {
        const text = await file.text();
        transactions = parseCSV(text);
      }

      if (transactions.length === 0) {
        setError("No debit transactions found.\n\n• Make sure you selected the correct bank above\n• For HDFC PDF: make sure it's the statement from NetBanking (not e-passbook)\n• Try downloading as Excel/CSV for 100% accuracy");
        setProcessing(false);
        return;
      }

      setProgress(`✅ Found ${transactions.length} transactions!`);
      setTimeout(() => { setProcessing(false); onData(transactions); }, 500);

    } catch (err) {
      if (err.message === "PDF_PASSWORD") {
        setError("⚠️ PDF is password protected.\n\nFor HDFC: the password is usually your Customer ID.\n\nBetter: Download as Excel from NetBanking — no password needed.");
      } else {
        setError("Error reading file: " + err.message);
      }
      setProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const instructions = {
    hdfc: "NetBanking → My Accounts → Account Statement → Select dates → Download PDF or Excel",
    sbi: "YONO App → Accounts → Account Statement → Download PDF or CSV",
    icici: "iMobile Pay → Accounts → Statements → Download PDF or Excel",
    axis: "Axis Mobile → Accounts → Account Statement → Download PDF or Excel",
    other: "Bank App → Accounts → Statement → Download PDF or CSV",
  };

  return (
    <div className="statement-upload">
      <div className="upload-logo">
        <span className="logo-icon">₹</span>
        <span className="logo-text">SpendIQ</span>
      </div>
      <h1 className="upload-title">Upload bank statement</h1>
      <p className="upload-sub">Upload your PDF or CSV bank statement — transactions detected automatically.</p>

      <div className="bank-selector">
        <div className="bank-selector-label">Select your bank:</div>
        <div className="bank-btns">
          {["hdfc", "sbi", "icici", "axis", "other"].map(b => (
            <button key={b} className={`bank-btn ${bank === b ? "active" : ""}`} onClick={() => setBank(b)}>
              {b.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`drop-zone ${dragging ? "dragging" : ""} ${processing ? "processing" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !processing && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.csv,.xls,.xlsx" style={{ display: "none" }}
          onChange={e => processFile(e.target.files[0])} />
        {processing ? (
          <div className="drop-processing">
            <div className="spinner large" />
            <div className="drop-progress">{progress}</div>
          </div>
        ) : (
          <>
            <div className="drop-icon">📄</div>
            <div className="drop-title">Drop your {bank.toUpperCase()} statement here</div>
            <div className="drop-sub">or click to browse</div>
            <div className="drop-types">PDF · CSV · Excel</div>
          </>
        )}
      </div>

      {error && <div className="error-msg" style={{ whiteSpace: "pre-line" }}>{error}</div>}

      <div className="bank-tips">
        <div className="bank-tip-title">📥 How to get your {bank.toUpperCase()} statement:</div>
        <div className="bank-tip-desc">{instructions[bank]}</div>
      </div>

      <div className="privacy-note">🔒 Processed entirely in your browser. Your data never leaves your device.</div>
    </div>
  );
}
