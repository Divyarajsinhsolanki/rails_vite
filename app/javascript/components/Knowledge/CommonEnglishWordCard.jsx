import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function CommonEnglishWordCard({
  cardType = "common_english_word",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [wordData, setWordData] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    async function loadWord() {
      try {
        const res = await fetch("/api/english_word");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setWordData({ ...data, fetched_at: new Date().toISOString() });
      } catch (err) {
        setWordData({ word: "Unable to fetch word" });
      } finally {
        setLoading(false);
      }
    }

    loadWord();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!wordData?.word) return null;
    return {
      cardType,
      sourceId: wordData.word,
      payload: wordData,
      title: "Common English Word",
      subtitle: wordData.word,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, wordData, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between min-h-[160px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">Common English Word</h2>
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
        <div className="text-sm text-gray-700 font-medium">{wordData?.word}</div>
      )}
    </div>
  );
}
