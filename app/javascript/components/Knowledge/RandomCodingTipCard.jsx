import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function RandomCodingTipCard({
  cardType = "coding_tip",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [tipData, setTipData] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    async function fetchCodingTip() {
      setLoading(true);
      try {
        const res = await fetch("/api/coding_tip");
        if (!res.ok) throw new Error("Network error");

        const data = await res.json();
        setTipData({ ...data, fetched_at: new Date().toISOString() });
      } catch (error) {
        setTipData({ tip: "Unable to fetch tip. Please try again later." });
      } finally {
        setLoading(false);
      }
    }

    fetchCodingTip();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!tipData?.tip) return null;
    return {
      cardType,
      sourceId: tipData.tip,
      payload: tipData,
      title: "AI Coding Tip of the Day",
      subtitle: tipData.tip,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, tipData, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between min-h-[180px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">💡 AI Coding Tip of the Day</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading AI-generated tip...</p>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">{tipData?.tip}</p>
      )}
    </div>
  );
}
