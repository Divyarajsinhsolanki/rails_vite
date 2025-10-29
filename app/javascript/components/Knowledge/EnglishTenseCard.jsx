import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function EnglishTenseCard({
  cardType = "english_tense",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [tense, setTense] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    async function loadTense() {
      try {
        const res = await fetch("/api/english_tense");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setTense({ ...data, fetched_at: new Date().toISOString() });
      } catch (err) {
        setTense({ tense: "Unable to fetch tense" });
      } finally {
        setLoading(false);
      }
    }

    loadTense();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!tense?.tense) return null;
    return {
      cardType,
      sourceId: tense.tense,
      payload: tense,
      title: "English Tense",
      subtitle: tense.example ? `${tense.tense} — ${tense.example}` : tense.tense,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, tense, savedBookmark]);

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
        <h2 className="text-lg font-semibold">English Tense</h2>
        <BookmarkToggle
          isBookmarked={isBookmarked}
          onToggle={handleToggle}
          collectionName={existingBookmark?.collection_name}
          disabled={!bookmarkPayload}
        />
      </div>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700 space-y-2">
          <div className="font-medium">{tense?.tense}</div>
          {tense?.example && <div className="italic">Example: {tense.example}</div>}
        </div>
      )}
    </div>
  );
}
