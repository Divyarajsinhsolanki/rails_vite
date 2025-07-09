import React, { useEffect, useState } from "react";

// API keys for gainers data
const API_KEYS = {
  FMP: "e5ye9VH06cq5TTNyyA6z2gd2S8pf9sBV", // Financial Modeling Prep
  ALPHA: "YOUR_ALPHA_VANTAGE_KEY", // AlphaVantage fallback
};

// Fetch functions in priority order
const fetchers = [
  // 1) Financial Modeling Prep top gainers on NSE
  () =>
    fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/gainers?exchange=NSE&apikey=${API_KEYS.FMP}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length)
          return data.slice(0, 5).map((d) => ({
            symbol: d.symbol || d.ticker,
            price: d.price || d.price || "N/A",
            change: d.changesPercentage || d.changes || "",
          }));
        throw new Error("Invalid FMP response");
      }),

  // 2) AlphaVantage market movers (top gainers) for India
  () =>
    fetch(
      `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&market=IN&apikey=${API_KEYS.ALPHA}`
    )
      .then((res) => res.json())
      .then((data) => {
        const arr = data?.top_gainers || data?.topGainers || [];
        if (Array.isArray(arr) && arr.length)
          return arr.slice(0, 5).map((d) => ({
            symbol: d.ticker || d.symbol,
            price: d.price || "N/A",
            change: d.change_percentage || d.change || "",
          }));
        throw new Error("Invalid AlphaVantage response");
      }),
];

export default function TopGainersCard() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const results = await fetcher();
          if (mounted) {
            setStocks(results);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Top gainers fetch failed:", e.message);
        }
      }
      if (mounted) {
        setStocks([]);
        setLoading(false);
      }
    }

    fetchWithFallback();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">🇮🇳 Top Gainers</h2>
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
