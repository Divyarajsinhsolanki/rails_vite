import React, { useEffect, useState } from "react";

export default function EnglishTenseCard() {
  const [tense, setTense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTense() {
      try {
        const res = await fetch("/api/english_tense");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setTense(data);
      } catch (err) {
        setTense({ tense: "Unable to fetch tense" });
      } finally {
        setLoading(false);
      }
    }

    loadTense();
  }, []);

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 h-full flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-2">\u23F3 English Tense</h2>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm text-gray-700 space-y-1">
          <div className="font-medium">{tense.tense}</div>
          {tense.example && <div className="italic">Example: {tense.example}</div>}
        </div>
      )}
    </div>
  );
}
