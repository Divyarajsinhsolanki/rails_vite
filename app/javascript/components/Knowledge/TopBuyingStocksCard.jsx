import React, { useEffect, useState } from "react";

// API keys for buy volume data
const API_KEYS = {
  FMP: "YOUR_FMP_API_KEY", // Financial Modeling Prep
  ALPHA: "YOUR_ALPHA_VANTAGE_KEY", // AlphaVantage fallback
};

const fetchers = [
  // 1) Financial Modeling Prep actives endpoint as a proxy for heavy buying
  () =>
    fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${API_KEYS.FMP}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length)
          return data.slice(0, 5).map((d) => ({
            symbol: d.symbol || d.ticker,
            qty: d.volume || d.avgVolume || "N/A",
          }));
        throw new Error("Invalid FMP response");
      }),

  // 2) AlphaVantage market movers for most active stocks
  () =>
    fetch(
      `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${API_KEYS.ALPHA}`
    )
      .then((res) => res.json())
      .then((data) => {
        const arr = data?.most_actively_traded || data?.mostActiveStock;
        if (Array.isArray(arr) && arr.length)
          return arr.slice(0, 5).map((d) => ({
            symbol: d.ticker || d.symbol,
            qty: d.volume || "N/A",
          }));
        throw new Error("Invalid AlphaVantage response");
      }),
];

export default function TopBuyingStocksCard() {
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
          console.warn("Top buying fetch failed:", e.message);
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
