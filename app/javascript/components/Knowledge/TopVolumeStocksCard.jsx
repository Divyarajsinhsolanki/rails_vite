import React, { useEffect, useState } from "react";

// API keys for external stock data sources
const API_KEYS = {
  FMP: "YOUR_FMP_API_KEY", // Financial Modeling Prep
  ALPHA: "YOUR_ALPHA_VANTAGE_KEY", // AlphaVantage fallback
};

// Functions that fetch stock data in priority order
const fetchers = [
  // 1) Financial Modeling Prep - most active stocks (high volume)
  () =>
    fetch(
      `https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${API_KEYS.FMP}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length)
          return data.slice(0, 5).map((d) => ({
            symbol: d.symbol || d.ticker,
            volume: d.volume || d.avgVolume || "N/A",
          }));
        throw new Error("Invalid FMP response");
      }),

  // 2) AlphaVantage market movers endpoint
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
            volume: d.volume || "N/A",
          }));
        throw new Error("Invalid AlphaVantage response");
      }),
];

export default function TopVolumeStocksCard() {
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
          console.warn("Top volume fetch failed:", e.message);
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
