import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const FACT_COUNT = 5;

export default function DailyFactCard({
  cardType = "daily_fact",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [facts, setFacts] = useState(() => (hasInitialData ? initialData?.facts || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    async function loadFacts() {
      try {
        const requests = Array.from({ length: FACT_COUNT }).map(() =>
          fetch("https://uselessfacts.jsph.pl/api/v2/facts/random")
            .then((res) => res.json())
            .then((data) => data.text)
        );
        const results = await Promise.all(requests);
        setFacts(results);
      } catch (err) {
        console.error("Fact fetch failed", err);
        setFacts(["Unable to load facts today. Try again later."]);
      } finally {
        setLoading(false);
      }
    }

    loadFacts();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!facts.length) return null;
    return {
      cardType,
      sourceId: facts[0],
      payload: { facts },
      title: "Daily Facts",
      subtitle: facts[0],
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, facts, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between min-h-[220px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">💡 Daily Fact</h2>
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
        <ul className="text-sm text-gray-700 italic space-y-1">
          {facts.map((fact, idx) => (
            <li key={idx}>• {fact}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
