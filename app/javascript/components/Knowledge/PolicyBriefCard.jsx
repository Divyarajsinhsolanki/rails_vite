import React, { useCallback, useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const TOPIC_OPTIONS = [
  { value: "global", label: "Global Governance" },
  { value: "economy", label: "Economic Policy" },
  { value: "technology", label: "Technology & Innovation" },
  { value: "health", label: "Health Policy" },
];

const normalizeTopic = (value) => {
  if (!value) return "global";
  const normalized = value.toLowerCase();
  return TOPIC_OPTIONS.some((option) => option.value === normalized) ? normalized : "global";
};

export default function PolicyBriefCard({
  cardType = "policy_briefs",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
  isSavedView = false,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;

  const defaultTopic = useMemo(() => {
    if (initialData?.topic) return normalizeTopic(initialData.topic);
    if (savedBookmark?.payload?.topic) return normalizeTopic(savedBookmark.payload.topic);
    return "global";
  }, [initialData?.topic, savedBookmark?.payload?.topic]);

  const [topic, setTopic] = useState(defaultTopic);
  const [briefs, setBriefs] = useState(() => (hasInitialData ? initialData?.briefs || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState(null);

  const topicLabel = useMemo(() => {
    const option = TOPIC_OPTIONS.find((item) => item.value === topic);
    return option?.label || topic;
  }, [topic]);

  const loadBriefs = useCallback(
    async (selectedTopic) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/news/policy_briefs?topic=${encodeURIComponent(selectedTopic)}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load policy briefs");
        const data = await response.json();
        if (data?.topic) {
          const normalized = normalizeTopic(data.topic);
          setTopic((current) => (current === normalized ? current : normalized));
        }
        setBriefs(data?.briefs || []);
      } catch (err) {
        setBriefs([]);
        setError(err.message || "Unable to load policy briefs");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (hasInitialData) return;
    loadBriefs(topic);
  }, [hasInitialData, loadBriefs, topic]);

  const bookmarkPayload = useMemo(() => {
    if (!briefs.length) return null;
    const leadingBrief = briefs[0];
    return {
      cardType,
      sourceId: `${topic}-${leadingBrief?.title || "policy-brief"}`,
      payload: { topic, briefs },
      title: `Policy Briefs (${topicLabel})`,
      subtitle: leadingBrief?.title || "Policy brief",
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [
    briefs,
    cardType,
    savedBookmark?.collection_name,
    savedBookmark?.reminder_interval_days,
    topic,
    topicLabel,
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

  const handleTopicChange = (event) => {
    setTopic(normalizeTopic(event.target.value));
  };

  const handleRefresh = () => {
    loadBriefs(topic);
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[240px]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">🏛️ Policy Briefs</h2>
          <p className="text-xs text-gray-500">Stay ahead with curated {topicLabel.toLowerCase()} insights.</p>
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
            Topic
            <select
              className="ml-2 border border-gray-300 rounded-md text-xs px-2 py-1"
              value={topic}
              onChange={handleTopicChange}
              disabled={loading}
            >
              {TOPIC_OPTIONS.map((option) => (
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
        <div className="text-sm text-gray-500">Loading briefs...</div>
      ) : briefs.length ? (
        <ul className="text-sm space-y-2 text-gray-700 overflow-auto">
          {briefs.map((brief, idx) => (
            <li key={`${brief.url}-${idx}`}>
              <a
                href={brief.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                • {brief.title}
              </a>
              {brief.source && (
                <p className="text-xs text-gray-500">
                  {brief.source}
                  {brief.published_at ? ` • ${new Date(brief.published_at).toLocaleDateString()}` : ""}
                </p>
              )}
              {brief.summary && <p className="text-xs text-gray-600">{brief.summary}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No policy briefs available.</div>
      )}
    </div>
  );
}
