import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function OpenIssueSpotlightCard({
  cardType = "open_issue_spotlight",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [issue, setIssue] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasInitialData) return;

    let active = true;

    async function fetchIssue() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/open_issue_spotlight");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        if (active) {
          setIssue(data);
        }
      } catch (err) {
        console.error("Open issue fetch failed", err);
        if (active) {
          setError("Unable to load an open source issue right now.");
          setIssue(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchIssue();
    return () => {
      active = false;
    };
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!issue?.url) return null;
    return {
      cardType,
      sourceId: issue.url,
      payload: issue,
      title: `Open Source Issue: ${issue.title}`,
      subtitle: issue.summary,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, issue, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between min-h-[200px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">🐙 Open Issue Spotlight</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Finding a community issue to tackle...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : issue ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800 uppercase tracking-wide">{issue.repository}</p>
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-blue-600 hover:underline"
          >
            {issue.title}
          </a>
          <p className="text-sm text-gray-700 leading-relaxed">{issue.summary}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No open issue spotlight available.</p>
      )}
    </div>
  );
}
