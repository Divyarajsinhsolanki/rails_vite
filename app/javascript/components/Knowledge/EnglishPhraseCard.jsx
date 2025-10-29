import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function EnglishPhraseCard({
  cardType = "english_phrase",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [phrase, setPhrase] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    async function loadPhrase() {
      try {
        const res = await fetch("/api/english_phrase");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setPhrase({ ...data, fetched_at: new Date().toISOString() });
      } catch (err) {
        setPhrase({ phrase: "Unable to fetch phrase" });
      } finally {
        setLoading(false);
      }
    }

    loadPhrase();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!phrase?.phrase) return null;
    return {
      cardType,
      sourceId: phrase.phrase,
      payload: phrase,
      title: "English Phrase",
      subtitle: phrase.author ? `${phrase.phrase} — ${phrase.author}` : phrase.phrase,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, phrase, savedBookmark]);

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
        <h2 className="text-lg font-semibold">English Phrase</h2>
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
          <p className="italic">“{phrase?.phrase}”</p>
          {phrase?.author && <p className="text-right text-gray-500">— {phrase.author}</p>}
        </div>
      )}
    </div>
  );
}
