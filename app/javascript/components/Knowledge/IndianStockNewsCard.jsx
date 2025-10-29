import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  NEWSDATA: "YOUR_NEWSDATA_API_KEY",
};

const fetchers = [
  () =>
    fetch("https://inshorts.vercel.app/api/news?category=business")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.length)
          return data.data.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Inshorts response");
      }),
  () =>
    fetch(`https://newsdata.io/api/1/news?apikey=${API_KEYS.NEWSDATA}&country=in&category=business`)
      .then((res) => res.json())
      .then((data) => {
        const arr = data?.results;
        if (Array.isArray(arr) && arr.length)
          return arr.slice(0, 5).map((a) => ({ title: a.title, url: a.link }));
        throw new Error("Invalid NewsData response");
      }),
];

export default function IndianStockNewsCard({
  cardType = "indian_stock_news",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [articles, setArticles] = useState(() => (hasInitialData ? initialData?.articles || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    let mounted = true;

    async function fetchWithFallback() {
      for (const fetcher of fetchers) {
        try {
          const results = await fetcher();
          if (mounted) {
            setArticles(results);
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Indian news fetch failed:", error.message);
        }
      }
      if (mounted) {
        setArticles([]);
        setLoading(false);
      }
    }

    fetchWithFallback();
    return () => {
      mounted = false;
    };
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!articles.length) return null;
    return {
      cardType,
      sourceId: articles[0]?.title || "indian-market-news",
      payload: { articles },
      title: "Indian Market News",
      subtitle: articles[0]?.title,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, articles, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[220px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">🇮🇳 Market News</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : articles.length ? (
        <ul className="text-sm space-y-2 text-gray-700 overflow-auto">
          {articles.map((article, idx) => (
            <li key={idx}>
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                • {article.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No news available</div>
      )}
    </div>
  );
}
