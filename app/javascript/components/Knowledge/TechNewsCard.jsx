import React, { useEffect, useState } from "react";

const API_KEYS = {
  NEWSAPI: "YOUR_NEWSAPI_KEY", // secondary
};

const fetchers = [
  // 1) Hacker News Algolia API
  () =>
    fetch(
      "https://hn.algolia.com/api/v1/search?tags=story&query=technology&hitsPerPage=5"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.hits?.length)
          return data.hits.map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Hacker News response");
      }),

  // 2) NewsAPI technology headlines
  () =>
    fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=technology&apiKey=${API_KEYS.NEWSAPI}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.articles?.length)
          return data.articles.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid NewsAPI response");
      }),

  // 3) Ars Technica RSS via rss2json
  () =>
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.arstechnica.com/arstechnica/index"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.items?.length)
          return data.items.slice(0, 5).map((a) => ({ title: a.title, url: a.link }));
        throw new Error("Invalid Ars Technica RSS response");
      }),
];

export default function TechNewsCard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        } catch (e) {
          console.warn("Tech news fetch failed:", e.message);
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
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">💻 Tech News</h2>
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
