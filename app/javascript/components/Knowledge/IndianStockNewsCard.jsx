import React, { useEffect, useState } from "react";

const fetchers = [
  () =>
    fetch("https://inshorts.vercel.app/api/news?category=business")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.length)
          return data.data.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Inshorts response");
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
