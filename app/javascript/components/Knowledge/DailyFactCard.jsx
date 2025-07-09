import React, { useEffect, useState } from "react";

const FACT_COUNT = 5;

export default function DailyFactCard() {
  const [facts, setFacts] = useState([]);
  
  useEffect(() => {
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
      }
    }

    loadFacts();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">💡 Daily Fact</h2>
      {facts.length ? (
        <ul className="text-sm text-gray-700 italic space-y-1">
          {facts.map((f, idx) => (
            <li key={idx}>• {f}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">Loading...</div>
      )}
    </div>
  );
}
