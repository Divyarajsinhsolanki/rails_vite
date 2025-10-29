import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  GNEWS: "d098827abeb336616016d7585e1931e9",
  NEWSAPI: "YOUR_NEWSAPI_KEY",
};

export default function TopNewsCard({
  cardType = "top_news",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [articles, setArticles] = useState(() => (hasInitialData ? initialData?.articles || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);

  const fetchers = useMemo(
    () => [
      () =>
        fetch(`https://gnews.io/api/v4/top-headlines?lang=en&token=${API_KEYS.GNEWS}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.articles && data.articles.length) return data.articles.slice(0, 5);
            throw new Error("No articles in GNews response");
          }),
      () =>
        fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEYS.NEWSAPI}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.articles && data.articles.length) return data.articles.slice(0, 5);
            throw new Error("No articles in NewsAPI response");
          }),
      () =>
        fetch("https://api.rss2json.com/v1/api.json?rss_url=https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml")
          .then((res) => res.json())
          .then((data) => {
            if (data.items && data.items.length) return data.items.slice(0, 5);
            throw new Error("No articles in RSS backup");
          }),
    ],
    []
  );

  useEffect(() => {
    if (hasInitialData) return;

    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const latestArticles = await fetcher();
          if (mounted) {
            setArticles(latestArticles);
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Fetch failed, trying next API:", error.message);
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
  }, [fetchers, hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!articles.length) return null;
    return {
      cardType,
      sourceId: articles[0]?.title || articles[0]?.title_no_format || "top-news",
      payload: { articles },
      title: "Top News",
      subtitle: articles[0]?.title || "Top headlines",
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
        <h2 className="text-lg font-semibold">📰 Top News</h2>
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
              <a
                href={article.url || article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                • {article.title || article.title_no_format}
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
