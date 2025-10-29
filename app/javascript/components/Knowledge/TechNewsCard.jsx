import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const API_KEYS = {
  NEWSAPI: "YOUR_NEWSAPI_KEY",
};

const fetchers = [
  () =>
    fetch("https://hn.algolia.com/api/v1/search?tags=story&query=technology&hitsPerPage=5")
      .then((res) => res.json())
      .then((data) => {
        if (data?.hits?.length)
          return data.hits.map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Hacker News response");
      }),
  () =>
    fetch(`https://newsapi.org/v2/top-headlines?country=us&category=technology&apiKey=${API_KEYS.NEWSAPI}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.articles?.length)
          return data.articles.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid NewsAPI response");
      }),
  () =>
    fetch("https://api.rss2json.com/v1/api.json?rss_url=https://feeds.arstechnica.com/arstechnica/index")
      .then((res) => res.json())
      .then((data) => {
        if (data?.items?.length)
          return data.items.slice(0, 5).map((a) => ({ title: a.title, url: a.link }));
        throw new Error("Invalid Ars Technica RSS response");
      }),
];

export default function TechNewsCard({
  cardType = "tech_news",
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
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const results = await fetcher();
          if (mounted) {
            setArticles(results);
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Tech news fetch failed:", error.message);
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
      sourceId: articles[0]?.title || "tech-news",
      payload: { articles },
      title: "Tech News",
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
        <h2 className="text-lg font-semibold">💻 Tech News</h2>
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
        <div className="text-sm text-gray-500">No tech news available</div>
      )}
    </div>
  );
}
