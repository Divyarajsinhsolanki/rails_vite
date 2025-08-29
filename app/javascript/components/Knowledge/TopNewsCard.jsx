import React, { useEffect, useState } from "react";

const API_KEYS = {
  GNEWS: "d098827abeb336616016d7585e1931e9",          // primary
  NEWSAPI: "YOUR_NEWSAPI_KEY",          // secondary
};

export default function TopNewsCard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // API URLs in priority order with fetch functions
  const fetchers = [
    // 1) GNews API
    () =>
      fetch(`https://gnews.io/api/v4/top-headlines?lang=en&token=${API_KEYS.GNEWS}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.articles && data.articles.length) return data.articles.slice(0, 5);
          throw new Error("No articles in GNews response");
        }),

    // 2) NewsAPI.org
    () =>
      fetch(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEYS.NEWSAPI}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.articles && data.articles.length) return data.articles.slice(0, 5);
          throw new Error("No articles in NewsAPI response");
        }),

    // 3) Backup public RSS to JSON (example)
    () =>
      fetch("https://api.rss2json.com/v1/api.json?rss_url=https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml")
        .then((res) => res.json())
        .then((data) => {
          if (data.items && data.items.length) return data.items.slice(0, 5);
          throw new Error("No articles in RSS backup");
        }),
  ];

  useEffect(() => {
    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (let fetcher of fetchers) {
        try {
          const articles = await fetcher();
          if (mounted) {
            setArticles(articles);
            setLoading(false);
          }
          return;
        } catch (e) {
          console.warn("Fetch failed, trying next API:", e.message);
        }
      }
      // all failed
      if (mounted) {
        setArticles([]);
        setLoading(false);
      }
    }

    fetchWithFallback();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-2">📰 Top News</h2>
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
