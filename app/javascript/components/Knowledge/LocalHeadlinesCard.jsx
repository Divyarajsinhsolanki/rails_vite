import React, { useCallback, useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const REGION_OPTIONS = [
  { value: "us", label: "United States" },
  { value: "in", label: "India" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
];

const inferRegionFromNavigator = () => {
  if (typeof navigator === "undefined") return "us";
  const locale = navigator.language || navigator.userLanguage;
  if (!locale) return "us";
  const [, regionPart] = locale.split("-");
  return regionPart ? regionPart.toLowerCase() : "us";
};

const normalizeRegion = (value) => {
  if (!value) return "us";
  const normalized = value.toLowerCase();
  return REGION_OPTIONS.some((option) => option.value === normalized) ? normalized : "us";
};

export default function LocalHeadlinesCard({
  cardType = "local_headlines",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
  isSavedView = false,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;

  const defaultRegion = useMemo(() => {
    if (initialData?.region) return normalizeRegion(initialData.region);
    if (savedBookmark?.payload?.region) return normalizeRegion(savedBookmark.payload.region);
    return normalizeRegion(inferRegionFromNavigator());
  }, [initialData?.region, savedBookmark?.payload?.region]);

  const [region, setRegion] = useState(defaultRegion);
  const [articles, setArticles] = useState(() => (hasInitialData ? initialData?.articles || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState(null);

  const regionLabel = useMemo(() => {
    const option = REGION_OPTIONS.find((item) => item.value === region);
    return option?.label || region.toUpperCase();
  }, [region]);

  const loadHeadlines = useCallback(
    async (selectedRegion) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/news/local_headlines?region=${encodeURIComponent(selectedRegion)}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load headlines");
        const data = await response.json();
        if (data?.region) {
          const normalized = normalizeRegion(data.region);
          setRegion((current) => (current === normalized ? current : normalized));
        }
        setArticles(data?.articles || []);
      } catch (err) {
        setArticles([]);
        setError(err.message || "Unable to load headlines");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (hasInitialData) return;
    loadHeadlines(region);
  }, [hasInitialData, loadHeadlines, region]);

  const bookmarkPayload = useMemo(() => {
    if (!articles.length) return null;
    const leadingArticle = articles[0];
    return {
      cardType,
      sourceId: `${region}-${leadingArticle?.title || "local-headlines"}`,
      payload: { region, articles },
      title: `Local Headlines (${regionLabel})`,
      subtitle: leadingArticle?.title || "Local headlines",
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [
    articles,
    cardType,
    region,
    regionLabel,
    savedBookmark?.collection_name,
    savedBookmark?.reminder_interval_days,
  ]);

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

  const handleRegionChange = (event) => {
    const nextRegion = normalizeRegion(event.target.value);
    setRegion(nextRegion);
  };

  const handleRefresh = () => {
    loadHeadlines(region);
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[240px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">🗞️ Local Headlines</h2>
          <p className="text-xs text-gray-500">Curated headlines for {regionLabel}.</p>
        </div>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>

      {!isSavedView && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <label className="text-xs font-medium text-gray-600">
            Region
            <select
              className="ml-2 border border-gray-300 rounded-md text-xs px-2 py-1"
              value={region}
              onChange={handleRegionChange}
              disabled={loading}
            >
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="self-start sm:self-auto text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            Refresh
          </button>
        </div>
      )}

      {error && <div className="text-xs text-red-500 mb-2">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-500">Loading headlines...</div>
      ) : articles.length ? (
        <ul className="text-sm space-y-2 text-gray-700 overflow-auto">
          {articles.map((article, idx) => (
            <li key={`${article.url}-${idx}`}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                • {article.title}
              </a>
              {article.source && (
                <p className="text-xs text-gray-500">
                  {article.source}
                  {article.published_at ? ` • ${new Date(article.published_at).toLocaleDateString()}` : ""}
                </p>
              )}
              {article.summary && <p className="text-xs text-gray-600">{article.summary}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No local headlines available.</div>
      )}
    </div>
  );
}
