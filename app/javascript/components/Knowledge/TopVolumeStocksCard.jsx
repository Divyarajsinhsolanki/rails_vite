import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  FMP: "e5ye9VH06cq5TTNyyA6z2gd2S8pf9sBV",
  ALPHA: "YOUR_ALPHA_VANTAGE_KEY",
};

const fetchers = [
  () =>
    fetch(`https://financialmodelingprep.com/api/v3/stock_market/actives?exchange=NSE&apikey=${API_KEYS.FMP}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length)
          return data.slice(0, 5).map((d) => ({
            symbol: d.symbol || d.ticker,
            volume: d.volume || d.avgVolume || "N/A",
          }));
        throw new Error("Invalid FMP response");
      }),
  () =>
    fetch(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&market=IN&apikey=${API_KEYS.ALPHA}`)
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

export default function TopVolumeStocksCard({
  cardType = "top_volume",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [stocks, setStocks] = useState(() => (hasInitialData ? initialData?.stocks || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

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
        } catch (error) {
          console.warn("Top volume fetch failed:", error.message);
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
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!stocks.length) return null;
    return {
      cardType,
      sourceId: stocks[0]?.symbol || "top-volume",
      payload: { stocks },
      title: "Top Volume",
      subtitle: `${stocks[0]?.symbol} • ${stocks[0]?.volume}`,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, stocks, savedBookmark]);

  const existingBookmark = bookmarkPayload
    ? bookmarkHelpers?.find?.(bookmarkPayload) || savedBookmark
    : savedBookmark;
  const isBookmarked = Boolean(existingBookmark);

  const handleToggle = () => {
    if (!bookmarkPayload) return;
    bookmarkHelpers?.toggle?.({
      ...bookmarkPayload,
      collectionName: existingBookmark?.collection_name ?? bookmarkPayload.collectionName,
    });
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[200px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">🇮🇳 Top Volume</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : stocks.length ? (
        <ul className="text-sm space-y-1 text-gray-700 overflow-auto">
          {stocks.map((stock, idx) => (
            <li key={idx}>• {stock.symbol} - {stock.volume}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
