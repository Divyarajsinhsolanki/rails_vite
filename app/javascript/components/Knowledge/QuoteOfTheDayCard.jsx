import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

const fetchers = [
  () =>
    fetch("https://zenquotes.io/api/today")
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]?.q) return data[0];
        throw new Error("Invalid ZenQuotes response");
      }),
  () =>
    fetch("https://api.quotable.io/random")
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) return { q: data.content, a: data.author };
        throw new Error("Invalid Quotable response");
      }),
  () =>
    fetch("https://quotes.rest/qod?language=en")
      .then((res) => res.json())
      .then((data) => {
        const qod = data?.contents?.quotes?.[0];
        if (qod?.quote) return { q: qod.quote, a: qod.author };
        throw new Error("Invalid They Said So response");
      }),
];

const fallbackQuotes = [
  { q: "Practice makes perfect.", a: "Unknown" },
  { q: "Code is like humor. When you have to explain it, it's bad.", a: "Cory House" },
  { q: "First, solve the problem. Then, write the code.", a: "John Johnson" },
  { q: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", a: "Martin Fowler" },
];

export default function QuoteOfTheDayCard({
  cardType = "quote_of_the_day",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [quote, setQuote] = useState(() => (hasInitialData ? initialData : null));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    let mounted = true;

    async function fetchWithFallback() {
      setLoading(true);
      for (const fetcher of fetchers) {
        try {
          const result = await fetcher();
          if (mounted) {
            setQuote({ ...result, fetched_at: new Date().toISOString() });
            setLoading(false);
          }
          return;
        } catch (error) {
          console.warn("Quote fetch failed, trying next:", error.message);
        }
      }
      if (mounted) {
        const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setQuote({ ...fallback, fetched_at: new Date().toISOString(), fallback: true });
        setLoading(false);
      }
    }

    fetchWithFallback();
    return () => {
      mounted = false;
    };
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!quote?.q) return null;
    return {
      cardType,
      sourceId: `${quote.q}-${quote.a || "unknown"}`,
      payload: quote,
      title: "Quote of the Day",
      subtitle: quote.a ? `${quote.q} — ${quote.a}` : quote.q,
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, quote, savedBookmark]);

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
        <h2 className="text-lg font-semibold">🧘 Quote of the Day</h2>
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
        <blockquote className="text-sm italic text-gray-700 space-y-2">
          <p>“{quote?.q}”</p>
          {quote?.a && <footer className="text-right text-gray-500">– {quote.a}</footer>}
        </blockquote>
      )}
    </div>
  );
}
