import React, { useEffect, useState } from "react";

const sampleGainers = [
  { symbol: "RELIANCE", price: "2700", change: "+2.5%" },
  { symbol: "INFY", price: "1700", change: "+2.1%" },
  { symbol: "HDFCBANK", price: "1620", change: "+1.9%" },
  { symbol: "ICICIBANK", price: "970", change: "+1.8%" },
  { symbol: "TCS", price: "3570", change: "+1.7%" },
];

export default function TopGainersCard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStocks(sampleGainers);
    setLoading(false);
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">🏆 Top Gainers</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : stocks.length ? (
        <ul className="text-sm space-y-1 text-gray-700 overflow-auto">
          {stocks.map((s, idx) => (
            <li key={idx}>
              • {s.symbol} - {s.price} <span className="text-green-600">{s.change}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
