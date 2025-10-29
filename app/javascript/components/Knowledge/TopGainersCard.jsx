import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  FMP: "e5ye9VH06cq5TTNyyA6z2gd2S8pf9sBV",
  ALPHA: "YOUR_ALPHA_VANTAGE_KEY",
};

const fetchers = [
  () =>
    fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?exchange=NSE&apikey=${API_KEYS.FMP}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length)
          return data.slice(0, 5).map((d) => ({
            symbol: d.symbol || d.ticker,
            price: d.price || "N/A",
            change: d.changesPercentage || d.changes || "",
          }));
        throw new Error("Invalid FMP response");
      }),
  () =>
    fetch(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&market=IN&apikey=${API_KEYS.ALPHA}`)
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

export default function TopGainersCard({
  cardType = "top_gainers",
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
          console.warn("Top gainers fetch failed:", error.message);
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
      sourceId: stocks[0]?.symbol || "top-gainers",
      payload: { stocks },
      title: "Top Gainers",
      subtitle: `${stocks[0]?.symbol} ${stocks[0]?.change || ""}`,
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
        <h2 className="text-lg font-semibold">🇮🇳 Top Gainers</h2>
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
            <li key={idx}>
              • {stock.symbol} - {stock.price}{" "}
              <span className="text-green-600">{stock.change}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No data available</div>
      )}
    </div>
  );
}
