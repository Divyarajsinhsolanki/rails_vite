import React, { useEffect, useMemo, useState } from "react";
import BookmarkToggle from "./BookmarkToggle";

export default function TodayInHistoryCard({
  cardType = "today_in_history",
  bookmarkHelpers,
  initialData = null,
  savedBookmark = null,
}) {
  const hasInitialData = initialData !== null && initialData !== undefined;
  const [events, setEvents] = useState(() => (hasInitialData ? initialData?.events || [] : []));
  const [loading, setLoading] = useState(!hasInitialData);

  useEffect(() => {
    if (hasInitialData) return;

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    async function fetchEvents() {
      setLoading(true);
      try {
        const res = await fetch(`https://byabbe.se/on-this-day/${month}/${day}/events.json`);
        const data = await res.json();
        setEvents((data?.events || []).slice(0, 5));
      } catch (error) {
        console.error("Today in history fetch failed", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [hasInitialData]);

  const bookmarkPayload = useMemo(() => {
    if (!events.length) return null;
    return {
      cardType,
      sourceId: `${events[0]?.year}-${events[0]?.description?.slice(0, 20)}`,
      payload: { events },
      title: "Today in History",
      subtitle: events[0] ? `${events[0].year}: ${events[0].description}` : "",
      collectionName: savedBookmark?.collection_name,
      reminderIntervalDays: savedBookmark?.reminder_interval_days,
    };
  }, [cardType, events, savedBookmark]);

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
    <div className="bg-white shadow-md rounded-2xl p-4 flex flex-col min-h-[220px]">
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">📅 Today in History</h2>
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
        <ul className="text-sm space-y-2 text-gray-700 overflow-auto">
          {events.map((event, idx) => (
            <li key={idx}>
              <span className="font-medium">{event.year}:</span> {event.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
