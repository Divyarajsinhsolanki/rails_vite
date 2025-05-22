import React, { useEffect, useState } from "react";

export default function DailyFactCard() {
  const [fact, setFact] = useState(null);

  useEffect(() => {
    fetch("https://uselessfacts.jsph.pl/api/v2/facts/today")
      .then((res) => res.json())
      .then((data) => {
        setFact(data.text);
      })
      .catch((err) => {
        console.error("Fact fetch failed", err);
      });
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">💡 Daily Fact</h2>
      {fact ? (
        <p className="text-sm text-gray-700 italic">“{fact}”</p>
      ) : (
        <div className="text-sm text-gray-500">Loading...</div>
      )}
    </div>
  );
}
