import React, { useEffect, useState } from "react";

// API keys for optional fallbacks
const API_KEYS = {
  NEWSDATA: "YOUR_NEWSDATA_API_KEY", // https://newsdata.io/
};

// Try multiple sources in order
const fetchers = [
  // 1) Inshorts unofficial API
  () =>
    fetch("https://inshorts.vercel.app/api/news?category=business")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.length)
          return data.data.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Inshorts response");
      }),

  // 2) NewsData.io fallback
  () =>
    fetch(
      `https://newsdata.io/api/1/news?apikey=${API_KEYS.NEWSDATA}&country=in&category=business`
    )
      .then((res) => res.json())
      .then((data) => {
        const arr = data?.results;
        if (Array.isArray(arr) && arr.length)
          return arr.slice(0, 5).map((a) => ({ title: a.title, url: a.link }));
        throw new Error("Invalid NewsData response");
      }),
];

export default function IndianStockNewsCard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        } catch (e) {
          console.warn("Indian news fetch failed:", e.message);
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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-2">🇮🇳 Market News</h2>
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
