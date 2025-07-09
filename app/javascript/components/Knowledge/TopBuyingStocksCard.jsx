import React, { useEffect, useState } from "react";

const sampleBuying = [
  { symbol: "HDFCBANK", qty: "9M" },
  { symbol: "RELIANCE", qty: "8M" },
  { symbol: "BHARTIARTL", qty: "7M" },
  { symbol: "ITC", qty: "6M" },
  { symbol: "AXISBANK", qty: "5M" },
];

export default function TopBuyingStocksCard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStocks(sampleBuying);
    setLoading(false);
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">🛒 Top Buying</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : stocks.length ? (
        <ul className="text-sm space-y-1 text-gray-700 overflow-auto">
          {stocks.map((s, idx) => (
            <li key={idx}>• {s.symbol} - {s.qty}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
