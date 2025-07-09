import React, { useEffect, useState } from "react";

const sampleVolume = [
  { symbol: "RELIANCE", volume: "18M" },
  { symbol: "SBIN", volume: "15M" },
  { symbol: "TATAMOTORS", volume: "13M" },
  { symbol: "ICICIBANK", volume: "11M" },
  { symbol: "HINDALCO", volume: "10M" },
];

export default function TopVolumeStocksCard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStocks(sampleVolume);
    setLoading(false);
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">📊 Top Volume</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : stocks.length ? (
        <ul className="text-sm space-y-1 text-gray-700 overflow-auto">
          {stocks.map((s, idx) => (
            <li key={idx}>• {s.symbol} - {s.volume}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
