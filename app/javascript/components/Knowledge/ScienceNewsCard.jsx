import React, { useEffect, useState } from "react";

const API_KEYS = {
  GUARDIAN: "YOUR_GUARDIAN_KEY", // secondary
};

const fetchers = [
  // 1) Spaceflight News API (no key required)
  () =>
    fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data?.results?.length)
          return data.results.map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Spaceflight News response");
      }),

  // 2) ScienceDaily RSS via rss2json
  () =>
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://www.sciencedaily.com/rss/top/science.xml"
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.items?.length)
          return data.items.slice(0, 5).map((a) => ({ title: a.title, url: a.link }));
        throw new Error("Invalid ScienceDaily response");
      }),

  // 3) The Guardian science section
  () =>
    fetch(
      `https://content.guardianapis.com/search?section=science&page-size=5&api-key=${API_KEYS.GUARDIAN}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.response?.results?.length)
          return data.response.results.map((a) => ({ title: a.webTitle, url: a.webUrl }));
        throw new Error("Invalid Guardian response");
      }),

  // 4) Inshorts science news (unofficial)
  () =>
    fetch("https://inshorts.vercel.app/api/news?category=science")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.length)
          return data.data.slice(0, 5).map((a) => ({ title: a.title, url: a.url }));
        throw new Error("Invalid Inshorts response");
      }),
];

export default function ScienceNewsCard() {
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
          console.warn("Science news fetch failed:", e.message);
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
      <h2 className="text-lg font-semibold mb-2">🔬 Science News</h2>
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
        <div className="text-sm text-gray-500">No science news available</div>
      )}
    </div>
  );
}
