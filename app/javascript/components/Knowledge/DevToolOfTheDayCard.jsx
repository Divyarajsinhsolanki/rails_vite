import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function DevToolOfTheDayCard({
  cardType = "dev_tool_of_the_day",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [tool, setTool] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasInitialData) return;

    let active = true;

    async function fetchTool() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dev_tool_of_the_day");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        if (active) {
          setTool(data);
        }
      } catch (err) {
        console.error("Dev tool fetch failed", err);
        if (active) {
          setError("Unable to load a developer tool right now.");
          setTool(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTool();
    return () => {
      active = false;
    };
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!tool?.name) return null;
    return {
      cardType,
      sourceId: tool.url || tool.name,
      payload: tool,
      title: `Dev Tool: ${tool.name}`,
      subtitle: tool.description,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, tool, savedBookmark]);

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
        <h2 className="text-lg font-semibold">🛠️ Dev Tool of the Day</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading a developer productivity boost...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : tool ? (
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">{tool.name}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{tool.description}</p>
          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Explore {tool.name}
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No developer tool spotlight available.</p>
      )}
    </div>
  );
}
