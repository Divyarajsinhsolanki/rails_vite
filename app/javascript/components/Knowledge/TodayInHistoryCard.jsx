import React, { useEffect, useState } from "react";

export default function TodayInHistoryCard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    fetch(`https://byabbe.se/on-this-day/${month}/${day}/events.json`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events.slice(0, 5)); // Limit to 5 items
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">📅 Today in History</h2>
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
