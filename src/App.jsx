import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import "./index.css";

export default function App() {
  const [screen, setScreen] = useState("upload"); // "upload" | "dashboard"
  const [transactions, setTransactions] = useState([]);

  const handleData = (txns) => {
    setTransactions(txns);
    setScreen("dashboard");
  };

  return (
    <div className="app">
      {screen === "upload" ? (
        <Upload onData={handleData} />
      ) : (
        <Dashboard transactions={transactions} onBack={() => setScreen("upload")} />
      )}
    </div>
  );
}
